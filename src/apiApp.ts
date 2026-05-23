import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini API
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Heuristic Offline Fallback: Local Summarizer
export function generateHeuristicBriefing(emails: any[], displayName: string) {
  const count = emails.length;
  if (count === 0) {
    return {
      briefing: `Good morning, ${displayName || 'Scholar'}. You have no recent emails right now! Excellent job maintaining inbox-zero. Let's focus and have a highly productive day!`,
      summaries: []
    };
  }

  const urgentKeywords = ['urgent', 'exam', 'grade', 'test', 'fail', 'important', 'due', 'quiz', 'alert', 'error', 'required', 'warning', 'action', 'schedule'];
  
  const summaries = emails.map((e) => {
    const textToAnalyze = `${e.subject} ${e.snippet}`.toLowerCase();
    const isUrgent = urgentKeywords.some(keyword => textToAnalyze.includes(keyword)) || !!e.isUrgent;
    
    let summary = `Update regarding "${e.subject}" from ${e.sender || e.from || 'Academic Office'}.`;
    if (e.snippet) {
      summary = `Notice on "${e.subject}": ${e.snippet.slice(0, 90)}${e.snippet.length > 90 ? '...' : ''}`;
    }

    let actionItem = 'Review details and respond if required by your schedule.';
    if (textToAnalyze.includes('due') || textToAnalyze.includes('deadline')) {
      actionItem = 'Add due date to Timeline Matrix and complete priority components immediately.';
    } else if (textToAnalyze.includes('grade') || textToAnalyze.includes('score')) {
      actionItem = 'Check grades feedback and study any corrected mistakes.';
    } else if (textToAnalyze.includes('exam') || textToAnalyze.includes('quiz') || textToAnalyze.includes('test')) {
      actionItem = 'Schedule study intervals under Focus tab to prepare.';
    } else if (textToAnalyze.includes('meet') || textToAnalyze.includes('class') || textToAnalyze.includes('lecture')) {
      actionItem = 'Verify start time and review prerequisite class documents.';
    }

    return {
      id: e.id,
      summary,
      actionItem,
      isUrgent
    };
  });

  const urgentCount = summaries.filter(s => s.isUrgent).length;
  let briefing = `Good morning, ${displayName || 'Scholar'}. You have ${count} pending inbox updates needing attention.`;
  
  if (urgentCount > 0) {
    const primaryUrgent = summaries.find(s => s.isUrgent);
    briefing = `Good morning, ${displayName || 'Scholar'}. You have ${urgentCount} urgent academic matters needing attention, primarily: "${primaryUrgent?.summary || 'critical schedule update'}". Please review recommended actions below.`;
  } else if (count > 0) {
    briefing = `Good morning, ${displayName || 'Scholar'}. Your inbox is clear of critical emergencies today. Reviewing your ${count} standard updates, we recommend preparing your schedule and maintaining progress under Focus Mode!`;
  }

  return {
    briefing,
    summaries
  };
}

// Heuristic Offline Fallback: Local Classroom Coursework Compiler
export function generateHeuristicCoursework(emails: any[]) {
  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return { coursework: [] };
  }

  const urgentKeywords = ['urgent', 'exam', 'grade', 'test', 'fail', 'important', 'due', 'quiz', 'alert', 'error', 'required', 'warning', 'action'];
  const courseworkKeywords = ['assignment', 'homework', 'project', 'lab', 'report', 'reading', 'chapters', 'test', 'quiz', 'essay', 'syllabus', 'exam', 'midterm', 'final'];

  const coursework: any[] = [];

  emails.forEach((e) => {
    const subject = e.subject || '';
    const snippet = e.snippet || '';
    const textToAnalyze = `${subject} ${snippet}`.toLowerCase();

    const hasCourseworkTerm = courseworkKeywords.some(keyword => textToAnalyze.includes(keyword));
    const isAcademicSender = e.from && (
      e.from.includes('.edu') || 
      e.from.toLowerCase().includes('classroom') || 
      e.from.toLowerCase().includes('canvas') || 
      e.from.toLowerCase().includes('professor') || 
      e.from.toLowerCase().includes('university') || 
      e.from.toLowerCase().includes('school') || 
      e.from.toLowerCase().includes('instructor') || 
      e.from.toLowerCase().includes('teacher')
    );

    if (hasCourseworkTerm || isAcademicSender) {
      let course = 'ACAD 101';
      const m = textToAnalyze.match(/([a-z]{2,4})\s*(\d{3})/i);
      if (m) {
        course = `${m[1].toUpperCase()} ${m[2]}`;
      } else {
        if (textToAnalyze.includes('phys')) course = 'PHYS 301';
        else if (textToAnalyze.includes('comp') || textToAnalyze.includes('cs ') || textToAnalyze.includes('code')) course = 'CS 301';
        else if (textToAnalyze.includes('math') || textToAnalyze.includes('calc')) course = 'MATH 202';
        else if (textToAnalyze.includes('bio') || textToAnalyze.includes('chem')) course = 'SCI 101';
        else if (textToAnalyze.includes('hist') || textToAnalyze.includes('lit')) course = 'HUM 200';
      }

      let color = 'accent';
      if (textToAnalyze.includes('due') || textToAnalyze.includes('deadline') || urgentKeywords.some(kw => textToAnalyze.includes(kw))) {
        color = 'red';
      } else if (textToAnalyze.includes('exam') || textToAnalyze.includes('midterm') || textToAnalyze.includes('quiz')) {
        color = 'amber';
      } else if (textToAnalyze.includes('grade') || textToAnalyze.includes('reading')) {
        color = 'green';
      }

      let title = subject.length > 40 ? subject.substring(0, 37) + '...' : subject;
      if (title.toUpperCase().startsWith('FWRD:') || title.toUpperCase().startsWith('FWD:') || title.toUpperCase().startsWith('RE:')) {
        title = title.replace(/^(fwd|fwrd|re):\s*/i, '');
      }

      let desc = snippet;
      if (!desc) {
        desc = `Academic update from ${e.from || 'instructor'}. Review details to plan today's priorities.`;
      } else if (desc.length > 100) {
        desc = desc.substring(0, 97) + '...';
      }

      let meta = 'New Update';
      const dueMatch = textToAnalyze.match(/due\s+(?:on\s+)?([a-z0-9/:\-\s]{3,12})/i);
      if (dueMatch) {
        meta = `Due ${dueMatch[1].trim()}`;
      } else if (textToAnalyze.includes('due today')) {
        meta = 'Due TODAY';
      } else if (textToAnalyze.includes('due tomorrow')) {
        meta = 'Due Tomorrow';
      } else if (textToAnalyze.includes('grade') || textToAnalyze.includes('score')) {
        meta = 'Grade Released';
      }

      coursework.push({
        id: e.id,
        course,
        color,
        title,
        desc,
        meta,
        metaIcon: textToAnalyze.includes('comment') || textToAnalyze.includes('post') ? 'comment' : 'file'
      });
    }
  });

  return { coursework };
}

const app = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API: Gemini Chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ 
        error: 'GEMINI_API_KEY is not set. Please add it in Settings > Secrets.' 
      });
    }

    console.log('Sending message to Gemini...');
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: 'You are an elite academic assistant for ScholarHub. Provide concise, high-level academic help, focusing on STEM and humanities. Use Markdown for formatting.',
      },
    });

    const response = await chat.sendMessage({ message });
    res.json({ text: response.text });
  } catch (error: any) {
    if (error?.status === 429 || error?.statusCode === 429 || String(error).includes('429') || String(error).includes('quota')) {
      console.log('Chat API Fallback active due to rate limit/quota (429).');
      return res.json({ text: "It looks like our AI advisor is experiencing high study volume right now! To maintain your focus flow: remember to chunk your tasks into 25-minute Pomodoro sprints under the **Focus** tab, stay hydrated, and sync your classroom homework items directly." });
    }
    console.error('Gemini Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate response' });
  }
});

// API: Gemini Email Summarizer & Academic Briefing
app.post('/api/summarize-emails', async (req, res) => {
  const { emails, displayName } = req.body;
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ 
        error: 'GEMINI_API_KEY is not set. Please add it in Settings > Secrets.' 
      });
    }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.json({
        briefing: `Good morning, ${displayName || 'Scholar'}. You have no unread emails right now! You're completely up to date. Excellent job maintaining inbox-zero. Let's focus and have a highly productive day!`,
        summaries: []
      });
    }

    // Compile unread email headers & snippets
    const emailListText = emails.map((e, index) => {
      return `Email ${index + 1}:
ID: ${e.id}
From: ${e.from}
Subject: ${e.subject}
Snippet: ${e.snippet}
`;
    }).join('\n---\n');

    const prompt = `You are an elite academic advisor and personalized productivity assistant for "${displayName || 'Scholar'}".
Review the following recent emails and synthesize a personalized, direct, highly motivating academic & schedule briefing.
Additionally, provide a highly concise 1-sentence summary, urgent status, and recommended action item or next step for each individual email.

Your briefing should address the student by name, call out the single most critical or urgent update or task as a priority, and suggest a warm, encouraging focus goal for today.

Return the result purely in structured JSON with the required keys: "briefing" and "summaries". Do not wrap in markdown code blocks.

Emails to analyze:
${emailListText}`;

    console.log('Generating structured briefing with Gemini 3.5-flash...');
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            briefing: {
              type: Type.STRING,
              description: 'A 2-3 sentence supportive overview briefing. Must mention the most urgent update or task needing attention first, followed by clear next actions.'
            },
            summaries: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: 'The exact ID of the email being summarized.' },
                  summary: { type: Type.STRING, description: 'A highly concise 1-sentence summary of this email.' },
                  actionItem: { type: Type.STRING, description: 'A concrete action item or follow-up suggested from this email. Keep it short.' },
                  isUrgent: { type: Type.BOOLEAN, description: 'True if email indicates severe importance like exams, grades, warnings, or professor questions.' }
                },
                required: ['id', 'summary', 'actionItem', 'isUrgent']
              }
            }
          },
          required: ['briefing', 'summaries']
        }
      }
    });

    const resultText = response.text ? response.text.trim() : '{}';
    const parsed = JSON.parse(resultText);
    res.json(parsed);
  } catch (error: any) {
    if (error?.status === 429 || error?.statusCode === 429 || String(error).includes('429') || String(error).includes('quota')) {
      console.log('Email Summarizer fallback activated due to API limits.');
    } else {
      console.error('Email Summarizer Error:', error);
    }
    try {
      const fallback = generateHeuristicBriefing(emails || [], displayName || 'Scholar');
      return res.json(fallback);
    } catch (fallbackError) {
      console.error('Local Briefing Heuristic error:', fallbackError);
    }
    res.status(500).json({ error: error.message || 'Failed to generate academic briefing' });
  }
});

// API: Gemini Classroom Sync
app.post('/api/sync-classroom', async (req, res) => {
  const { emails } = req.body;
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ 
        error: 'GEMINI_API_KEY is not set. Please add it in Settings > Secrets.' 
      });
    }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.json({ coursework: [] });
    }

    // Compile raw email details for classroom analysis
    const emailListText = emails.map((e, index) => {
      return `School Notification ${index + 1}:
ID: ${e.id}
From: ${e.from}
Subject: ${e.subject}
Snippet: ${e.snippet}
`;
    }).join('\n---\n');

    const prompt = `You are an elite academic coursework organizer. Extract school assignments, homework, project guidelines, lab requirements, or classroom notices from these recent academic emails.
For each valid school coursework assignment or announcement found, generate a highly structured classroom object with these keys:
- "id": must be the exact original email ID: "${emails[0]?.id || ''}" or matching the relevant email's ID.
- "course": a clean, concise course abbreviation and code (e.g. "CS 301", "BIO 200", "PHYS 301") extracted from the sender, subject, or snippet.
- "color": color coding based on assignment priority or urgency (use "accent" for high priority/upcoming, "green" for standard class readings, "amber" for midterms/major assignments, or "red" for immediate warning/crucial action items).
- "title": a concise name of the assignment or announcement (e.g., "Homework 4", "Syllabus Update", "Midterm Correction", "Physics Lab Submission").
- "desc": a clear, direct, actionable, student-friendly 1-2 sentence description explaining exactly what needs to be done.
- "meta": high-level status indicator or deadline (e.g., "Due in 2 days", "New Feedback", "Assignment Graded", "Read Chapter 4").
- "metaIcon": visual classification, either "file" (for assignments, tasks, grades, files) or "comment" (for general class comments, announcements, syllabus discussions).

Only extract coursework actually mentioned in the emails. Ignore non-academic promotional or security emails entirely.
Return the result purely in structured JSON with the required key of "coursework". Do not wrap in markdown code blocks.

Emails to analyze:
${emailListText}`;

    console.log('Generating smart Classroom Coursework Sync with Gemini 3.5-flash...');
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            coursework: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: 'The original email ID associated with this piece of coursework.' },
                  course: { type: Type.STRING, description: 'Concise department and course code e.g., "MATH 101" or "CS 301".' },
                  color: { type: Type.STRING, description: 'A state color tag: accent, green, amber, or red.' },
                  title: { type: Type.STRING, description: 'Direct short name of the school item or task.' },
                  desc: { type: Type.STRING, description: 'Clear action-oriented instructions summarizing the work.' },
                  meta: { type: Type.STRING, description: 'Shorthand deadline or status e.g., "Due Friday" or "graded".' },
                  metaIcon: { type: Type.STRING, description: 'Icon classification tag: "file" or "comment".' }
                },
                required: ['id', 'course', 'color', 'title', 'desc', 'meta', 'metaIcon']
              }
            }
          },
          required: ['coursework']
        }
      }
    });

    const resultText = response.text ? response.text.trim() : '{"coursework": []}';
    const parsed = JSON.parse(resultText);
    res.json(parsed);
  } catch (error: any) {
    if (error?.status === 429 || error?.statusCode === 429 || String(error).includes('429') || String(error).includes('quota')) {
      console.log('Classroom Sync AI fallback activated due to API limits.');
    } else {
      console.error('Classroom Sync AI Error:', error);
    }
    try {
      const fallback = generateHeuristicCoursework(emails || []);
      return res.json(fallback);
    } catch (fallbackError) {
      console.error('Local Coursework Heuristic error:', fallbackError);
    }
    res.status(500).json({ error: error.message || 'Failed to sync classroom smarter' });
  }
});

export default app;
