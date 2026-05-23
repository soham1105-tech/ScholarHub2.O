export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  isUrgent: boolean;
  replied: boolean;
}

/**
 * Encodes a string into Base64URL
 */
function base64UrlEncode(str: string): string {
  const base64 = btoa(unescape(encodeURIComponent(str)));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Fetch list of messages matching query
 */
export async function listMessages(accessToken: string, q: string = 'is:unread'): Promise<{ id: string; threadId: string }[]> {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to list Gmail messages: ${response.statusText} - ${errText}`);
    }

    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    console.error('Error in listMessages:', error);
    return [];
  }
}

/**
 * Get detailed message information
 */
export async function getMessageDetails(accessToken: string, id: string): Promise<GmailMessage | null> {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch email details raw for: ${id}`);
    }

    const data = await response.json();
    const headers = data.payload?.headers || [];
    
    const findHeader = (name: string) => 
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    const from = findHeader('from');
    const subject = findHeader('subject');
    const dateValue = findHeader('date');
    
    // Check if urgent
    const urgentKeywords = ['urgent', 'asap', 'alert', 'emergency', 'critical', 'important', 'stat'];
    const textToSearch = `${subject} ${data.snippet || ''}`.toLowerCase();
    const isUrgent = urgentKeywords.some(keyword => textToSearch.includes(keyword));

    return {
      id: data.id,
      threadId: data.threadId,
      subject: subject || '(No Subject)',
      from: from || 'Unknown Sender',
      snippet: data.snippet || '(No snippet)',
      date: dateValue ? new Date(dateValue).toLocaleTimeString() : 'Unknown time',
      isUrgent,
      replied: false,
    };
  } catch (error) {
    console.error(`Error in getMessageDetails for ${id}:`, error);
    return null;
  }
}

/**
 * Sends a raw RFC 822 email message
 */
export async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string,
  threadId?: string
): Promise<boolean> {
  try {
    // Construct simplified RFC 822 email format
    const emailParts = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset="UTF-8"`,
      `Content-Transfer-Encoding: 7bit`,
      '',
      body,
    ];

    const rawEmail = emailParts.join('\r\n');
    const encodedEmail = base64UrlEncode(rawEmail);

    const url = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedEmail,
        ...(threadId ? { threadId } : {}),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Error sending email:', err);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in sendEmail:', error);
    return false;
  }
}

/**
 * Auto reply to standard sender
 */
export async function replyToSender(
  accessToken: string,
  message: GmailMessage,
  replyBody: string
): Promise<boolean> {
  // Extract clean email address from sender header
  // E.g., "John Doe <john@gmail.com>" -> "john@gmail.com"
  const emailRegex = /<([^>]+)>/;
  const match = message.from.match(emailRegex);
  const recipientEmail = match ? match[1] : message.from;

  const subject = message.subject.toLowerCase().startsWith('re:')
    ? message.subject
    : `Re: ${message.subject}`;

  return sendEmail(accessToken, recipientEmail, subject, replyBody, message.threadId);
}
