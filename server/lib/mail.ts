// server/lib/mail.ts
// Email sending functions for UpKeepQR

export const sendWelcomeEmail = async (params: any) => {
  // Implementation here
  console.log('Welcome email sent:', params);
  return { success: true };
};

export const sendOrderConfirmationEmail = async (params: any) => {
  // Implementation here
  console.log('Order confirmation email sent:', params);
  return { success: true };
};

export const sendContactFormEmails = async (params: any) => {
  // Implementation here
  console.log('Contact form emails sent:', params);
  return { success: true };
};

export const sendLeadNotificationEmail = async (params: any) => {
  // Implementation here
  console.log('Lead notification email sent:', params);
  return { success: true };
};

// Add any other email functions you need below
// Make sure each function is only declared ONCE

export const sendReminderEmail = async (params: {
  email: string;
  firstName: string;
  taskTitle: string;
  dueDate: string;
  description: string;
  howToSteps: string[];
  icsAttachment?: string;
}) => {
  // TODO: Implement actual email sending logic
  console.log('Reminder email sent:', {
    to: params.email,
    firstName: params.firstName,
    taskTitle: params.taskTitle,
    dueDate: params.dueDate,
    description: params.description,
    stepsCount: params.howToSteps.length,
    hasAttachment: !!params.icsAttachment
  });
  return { success: true };
};

export const getTaskHowToSteps = (taskName: string): string[] => {
  // Default how-to steps based on common task types
  const taskSteps: Record<string, string[]> = {
    'hvac_filter': [
      'Turn off your HVAC system',
      'Locate the air filter (usually near the return air duct or blower)',
      'Remove the old filter and note the size',
      'Insert the new filter with airflow arrow pointing toward the duct',
      'Turn the system back on'
    ],
    'smoke_detector': [
      'Press the test button on each detector',
      'Replace batteries if the chirping sound is weak',
      'Clean the detector with a soft brush or vacuum',
      'Replace any detectors older than 10 years'
    ],
    'water_heater': [
      'Turn off power/gas to the water heater',
      'Attach a hose to the drain valve',
      'Open the valve and drain several gallons',
      'Close the valve and remove the hose',
      'Turn power/gas back on'
    ],
    'gutter_cleaning': [
      'Set up a stable ladder on level ground',
      'Remove debris by hand or with a scoop',
      'Flush gutters with a garden hose',
      'Check and clear downspouts',
      'Inspect for damage or loose fasteners'
    ]
  };

  // Try to match task name to predefined steps
  const taskKey = taskName.toLowerCase().replace(/\s+/g, '_');
  if (taskSteps[taskKey]) {
    return taskSteps[taskKey];
  }

  // Return generic steps if no match found
  return [
    'Review the task requirements and gather necessary tools',
    'Follow manufacturer guidelines or professional recommendations',
    'Complete the task safely and thoroughly',
    'Document completion and note any issues discovered',
    'Schedule the next maintenance reminder'
  ];
};
