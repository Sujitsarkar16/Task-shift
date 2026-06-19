export const VOICE_SCHEMAS = {
  task: {
    properties: {
      title: {},
      description: {},
      priority: {},
      deadline: {},
      category: {},
      reminderDays: {},
      emailNotification: {},
    },
  },
  habit: {
    properties: {
      title: {},
      description: {},
    },
  },
  note: {
    properties: {
      title: {},
      content: {},
    },
  },
  subscription: {
    properties: {
      name: {},
      amount: {},
      billingCycle: {},
      renewalDate: {},
      category: {},
      notes: {},
    },
  },
} as const;
