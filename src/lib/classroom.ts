export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  alternateLink?: string;
}

export interface ClassroomItem {
  id: string;
  course: string;
  color: 'accent' | 'green' | 'amber' | 'red';
  title: string;
  desc: string;
  meta: string;
  metaIcon: 'file' | 'comment';
  link?: string;
}

/**
 * Fetch the authenticated user's active courses from Google Classroom
 */
export async function listActiveCourses(accessToken: string): Promise<ClassroomCourse[]> {
  try {
    const url = 'https://classroom.googleapis.com/v1/courses?studentId=me&courseStates=ACTIVE';
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`Classroom API list courses returned status ${response.status}: ${errText}`);
      return [];
    }

    const data = await response.json();
    return data.courses || [];
  } catch (error) {
    console.error('Error fetching Classroom courses:', error);
    return [];
  }
}

/**
 * Fetch coursework (assignments) for a specific course
 */
export async function listCourseWork(accessToken: string, courseId: string): Promise<any[]> {
  try {
    const url = `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      // It's common to not have coursework permissions or items on some classes, so fail silently
      return [];
    }

    const data = await response.json();
    return data.courseWork || [];
  } catch (error) {
    console.error(`Error fetching coursework for course ${courseId}:`, error);
    return [];
  }
}

/**
 * Fetch announcements for a specific course
 */
export async function listAnnouncements(accessToken: string, courseId: string): Promise<any[]> {
  try {
    const url = `https://classroom.googleapis.com/v1/courses/${courseId}/announcements`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.announcements || [];
  } catch (error) {
    console.error(`Error fetching announcements for course ${courseId}:`, error);
    return [];
  }
}

/**
 * Sync Classroom data live across all active courses and format it for the smart tracker
 */
export async function syncRealClassroom(accessToken: string): Promise<ClassroomItem[]> {
  const courses = await listActiveCourses(accessToken);
  if (!courses || courses.length === 0) {
    return [];
  }

  const allItems: ClassroomItem[] = [];

  // Limit query to first 6 active courses to prevent API quota/throttle issues
  const activeCoursesToFetch = courses.slice(0, 6);

  await Promise.all(
    activeCoursesToFetch.map(async (course) => {
      const [courseWork, announcements] = await Promise.all([
        listCourseWork(accessToken, course.id),
        listAnnouncements(accessToken, course.id)
      ]);

      courseWork.forEach((work) => {
        // Compute remaining / due info
        let meta = 'No due date';
        let color: 'accent' | 'green' | 'amber' | 'red' = 'green';
        if (work.dueDate) {
          const { year, month, day } = work.dueDate;
          const dueDateObj = new Date(year, month - 1, day);
          const today = new Date();
          const diffTime = dueDateObj.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            meta = 'Overdue';
            color = 'red';
          } else if (diffDays === 0) {
            meta = 'Due today';
            color = 'red';
          } else if (diffDays === 1) {
            meta = 'Due tomorrow';
            color = 'amber';
          } else {
            meta = `Due in ${diffDays} days`;
            color = diffDays <= 4 ? 'amber' : 'accent';
          }
        }

        allItems.push({
          id: work.id,
          course: course.name,
          color,
          title: work.title,
          desc: work.description || 'View details details in your Google Classroom portal.',
          meta,
          metaIcon: 'file',
          link: work.alternateLink,
        });
      });

      announcements.forEach((ann) => {
        allItems.push({
          id: ann.id,
          course: course.name,
          color: 'green',
          title: 'Class Announcement',
          desc: ann.text || 'New announcement posted on the class stream.',
          meta: ann.updateTime 
            ? `Posted ${new Date(ann.updateTime).toLocaleDateString()}` 
            : 'Recent',
          metaIcon: 'comment',
          link: ann.alternateLink,
        });
      });
    })
  );

  return allItems;
}
