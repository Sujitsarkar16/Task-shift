const numberTypes = ['int', 'long', 'double', 'decimal'];
const MAX_LIST_LIMIT = 500;

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    badRequest(`${fieldName} must be an object.`);
  }
  return value;
}

function asRequiredString(value, fieldName, maxLength = 2000) {
  if (typeof value !== 'string') {
    badRequest(`${fieldName} must be a string.`);
  }
  const normalized = value.trim();
  if (!normalized) {
    badRequest(`${fieldName} is required.`);
  }
  return normalized.slice(0, maxLength);
}

function asString(value, fieldName, maxLength = 2000, fallback = '') {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value !== 'string') {
    badRequest(`${fieldName} must be a string.`);
  }
  return value.trim().slice(0, maxLength);
}

function asOptionalString(value, fieldName, maxLength = 2000) {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    badRequest(`${fieldName} must be a string.`);
  }
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

function asEnum(value, fieldName, allowed, fallback) {
  if (value === undefined || value === null || value === '') {
    if (fallback !== undefined) {
      return fallback;
    }
    badRequest(`${fieldName} is required.`);
  }
  if (typeof value !== 'string' || !allowed.includes(value)) {
    badRequest(`${fieldName} must be one of: ${allowed.join(', ')}.`);
  }
  return value;
}

function asOptionalEnum(value, fieldName, allowed) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return asEnum(value, fieldName, allowed);
}

function asBoolean(value, fieldName, fallback = false) {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value !== 'boolean') {
    badRequest(`${fieldName} must be a boolean.`);
  }
  return value;
}

function asOptionalBoolean(value, fieldName) {
  if (value === undefined || value === null) {
    return undefined;
  }
  return asBoolean(value, fieldName);
}

function asNumber(value, fieldName, fallback, options = {}) {
  if (value === undefined || value === null || value === '') {
    if (fallback !== undefined) {
      return fallback;
    }
    badRequest(`${fieldName} is required.`);
  }
  if (typeof value !== 'number' || Number.isNaN(value)) {
    badRequest(`${fieldName} must be a number.`);
  }
  const { min, max, integer = false } = options;
  if (integer && !Number.isInteger(value)) {
    badRequest(`${fieldName} must be an integer.`);
  }
  if (min !== undefined && value < min) {
    badRequest(`${fieldName} must be >= ${min}.`);
  }
  if (max !== undefined && value > max) {
    badRequest(`${fieldName} must be <= ${max}.`);
  }
  return value;
}

function asOptionalNumber(value, fieldName, options = {}) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return asNumber(value, fieldName, undefined, options);
}

function asDate(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    badRequest(`${fieldName} is required.`);
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    badRequest(`${fieldName} must be a valid date.`);
  }
  return date;
}

function asOptionalDate(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return asDate(value, fieldName);
}

function asStringArray(value, fieldName, maxItems = 100, itemMaxLength = 160) {
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    badRequest(`${fieldName} must be an array.`);
  }
  const uniqueValues = new Set();
  for (const item of value) {
    if (typeof item !== 'string') {
      badRequest(`${fieldName} must contain strings only.`);
    }
    const normalized = item.trim().slice(0, itemMaxLength);
    if (normalized) {
      uniqueValues.add(normalized);
    }
  }
  return Array.from(uniqueValues).slice(0, maxItems);
}

function asOptionalStringArray(value, fieldName, maxItems = 100, itemMaxLength = 160) {
  if (value === undefined || value === null) {
    return undefined;
  }
  return asStringArray(value, fieldName, maxItems, itemMaxLength);
}

function asFlashcards(value) {
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    badRequest('cards must be an array.');
  }
  return value.slice(0, 500).map((card, index) => {
    const item = asPlainObject(card, `cards[${index}]`);
    return {
      front: asRequiredString(item.front, `cards[${index}].front`, 1000),
      back: asRequiredString(item.back, `cards[${index}].back`, 4000),
    };
  });
}

function buildProjectKey(source) {
  const seed = typeof source === 'string' ? source : '';
  const key = seed.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
  return key || undefined;
}

function finalizeUpdate(set = {}, unset = []) {
  const update = { $set: { ...set, updatedAt: new Date() } };
  if (unset.length > 0) {
    update.$unset = Object.fromEntries(unset.map((field) => [field, '']));
  }
  return update;
}

function baseSchema(required, properties) {
  return {
    bsonType: 'object',
    additionalProperties: false,
    required: [...required, 'createdAt', 'updatedAt'],
    properties: {
      _id: { bsonType: 'objectId' },
      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: 'date' },
      ...properties,
    },
  };
}

function stringField(maxLength = 2000) {
  return { bsonType: 'string', minLength: 1, maxLength };
}

function optionalStringField(maxLength = 2000) {
  return { bsonType: 'string', maxLength };
}

function numberField(extra = {}) {
  return { bsonType: numberTypes, ...extra };
}

const collectionDefinitions = {
  projects: {
    filters: { ownerId: 'string' },
    sortableFields: ['createdAt', 'updatedAt', 'name'],
    defaultSort: { createdAt: -1 },
    dateFields: ['createdAt', 'updatedAt'],
    validator: baseSchema(['ownerId', 'name'], {
      ownerId: stringField(120),
      name: stringField(140),
      key: { bsonType: 'string', pattern: '^[A-Z0-9]{1,5}$' },
      description: { bsonType: 'string', maxLength: 4000 },
    }),
    indexes: [
      { key: { ownerId: 1, createdAt: -1 }, name: 'owner_createdAt' },
      {
        key: { ownerId: 1, key: 1 },
        name: 'owner_key_unique',
        unique: true,
        partialFilterExpression: { key: { $exists: true, $type: 'string' } },
      },
    ],
    normalizeCreate(input) {
      const payload = asPlainObject(input, 'project');
      const name = asRequiredString(payload.name, 'name', 140);
      return {
        ownerId: asRequiredString(payload.ownerId, 'ownerId', 120),
        name,
        key: buildProjectKey(payload.key ?? name),
        description: asString(payload.description, 'description', 4000, ''),
      };
    },
    normalizeUpdate(input) {
      const payload = asPlainObject(input, 'project update');
      const set = {};
      const unset = [];

      if (hasOwn(payload, 'name')) {
        set.name = asRequiredString(payload.name, 'name', 140);
      }
      if (hasOwn(payload, 'key')) {
        const key = payload.key === null ? undefined : buildProjectKey(payload.key);
        if (key) {
          set.key = key;
        } else {
          unset.push('key');
        }
      }
      if (hasOwn(payload, 'description')) {
        set.description = asString(payload.description, 'description', 4000, '');
      }

      return finalizeUpdate(set, unset);
    },
  },
  workItems: {
    filters: { projectId: 'string', assigneeId: 'string', sprintId: 'string', parentId: 'string', status: 'string' },
    sortableFields: ['order', 'createdAt', 'updatedAt', 'dueDate'],
    defaultSort: { order: 1, createdAt: 1 },
    dateFields: ['dueDate', 'createdAt', 'updatedAt'],
    validator: baseSchema(['projectId', 'type', 'title', 'description', 'status', 'priority', 'reporterId', 'order'], {
      projectId: stringField(120),
      sprintId: optionalStringField(120),
      parentId: optionalStringField(120),
      type: { enum: ['epic', 'story', 'task', 'bug', 'subtask'] },
      title: stringField(240),
      description: { bsonType: 'string', maxLength: 12000 },
      status: { enum: ['todo', 'in-progress', 'review', 'done'] },
      priority: { enum: ['low', 'medium', 'high', 'urgent'] },
      blockedBy: {
        bsonType: 'array',
        maxItems: 100,
        items: { bsonType: 'string', maxLength: 120 },
      },
      assigneeId: optionalStringField(120),
      reporterId: stringField(120),
      storyPoints: numberField({ minimum: 0, maximum: 1000 }),
      dueDate: { bsonType: 'date' },
      order: numberField({ minimum: 0 }),
      color: optionalStringField(40),
      icon: optionalStringField(40),
    }),
    indexes: [
      { key: { projectId: 1, order: 1 }, name: 'project_order' },
      { key: { assigneeId: 1, createdAt: -1 }, name: 'assignee_createdAt' },
      { key: { projectId: 1, status: 1 }, name: 'project_status' },
      { key: { projectId: 1, sprintId: 1 }, name: 'project_sprint' },
    ],
    normalizeCreate(input) {
      const payload = asPlainObject(input, 'work item');
      return {
        projectId: asRequiredString(payload.projectId, 'projectId', 120),
        sprintId: asOptionalString(payload.sprintId, 'sprintId', 120),
        parentId: asOptionalString(payload.parentId, 'parentId', 120),
        type: asEnum(payload.type, 'type', ['epic', 'story', 'task', 'bug', 'subtask'], 'task'),
        title: asRequiredString(payload.title, 'title', 240),
        description: asString(payload.description, 'description', 12000, ''),
        status: asEnum(payload.status, 'status', ['todo', 'in-progress', 'review', 'done'], 'todo'),
        priority: asEnum(payload.priority, 'priority', ['low', 'medium', 'high', 'urgent'], 'medium'),
        blockedBy: asStringArray(payload.blockedBy, 'blockedBy', 100, 120),
        assigneeId: asOptionalString(payload.assigneeId, 'assigneeId', 120),
        reporterId: asRequiredString(payload.reporterId, 'reporterId', 120),
        storyPoints: asOptionalNumber(payload.storyPoints, 'storyPoints', { min: 0, max: 1000, integer: true }),
        dueDate: asOptionalDate(payload.dueDate, 'dueDate'),
        order: asNumber(payload.order, 'order', Date.now(), { min: 0 }),
        color: asOptionalString(payload.color, 'color', 40),
        icon: asOptionalString(payload.icon, 'icon', 40),
      };
    },
    normalizeUpdate(input) {
      const payload = asPlainObject(input, 'work item update');
      const set = {};
      const unset = [];

      if (hasOwn(payload, 'sprintId')) {
        const value = asOptionalString(payload.sprintId, 'sprintId', 120);
        if (value) set.sprintId = value;
        else unset.push('sprintId');
      }
      if (hasOwn(payload, 'parentId')) {
        const value = asOptionalString(payload.parentId, 'parentId', 120);
        if (value) set.parentId = value;
        else unset.push('parentId');
      }
      if (hasOwn(payload, 'type')) {
        set.type = asEnum(payload.type, 'type', ['epic', 'story', 'task', 'bug', 'subtask']);
      }
      if (hasOwn(payload, 'title')) {
        set.title = asRequiredString(payload.title, 'title', 240);
      }
      if (hasOwn(payload, 'description')) {
        set.description = asString(payload.description, 'description', 12000, '');
      }
      if (hasOwn(payload, 'status')) {
        set.status = asEnum(payload.status, 'status', ['todo', 'in-progress', 'review', 'done']);
      }
      if (hasOwn(payload, 'priority')) {
        set.priority = asEnum(payload.priority, 'priority', ['low', 'medium', 'high', 'urgent']);
      }
      if (hasOwn(payload, 'blockedBy')) {
        set.blockedBy = asStringArray(payload.blockedBy, 'blockedBy', 100, 120);
      }
      if (hasOwn(payload, 'assigneeId')) {
        const value = asOptionalString(payload.assigneeId, 'assigneeId', 120);
        if (value) set.assigneeId = value;
        else unset.push('assigneeId');
      }
      if (hasOwn(payload, 'storyPoints')) {
        const value = asOptionalNumber(payload.storyPoints, 'storyPoints', { min: 0, max: 1000, integer: true });
        if (value !== undefined) set.storyPoints = value;
        else unset.push('storyPoints');
      }
      if (hasOwn(payload, 'dueDate')) {
        const value = asOptionalDate(payload.dueDate, 'dueDate');
        if (value) set.dueDate = value;
        else unset.push('dueDate');
      }
      if (hasOwn(payload, 'order')) {
        set.order = asNumber(payload.order, 'order', undefined, { min: 0 });
      }
      if (hasOwn(payload, 'color')) {
        const value = asOptionalString(payload.color, 'color', 40);
        if (value) set.color = value;
        else unset.push('color');
      }
      if (hasOwn(payload, 'icon')) {
        const value = asOptionalString(payload.icon, 'icon', 40);
        if (value) set.icon = value;
        else unset.push('icon');
      }

      return finalizeUpdate(set, unset);
    },
  },
  testCases: {
    filters: { projectId: 'string', suiteId: 'string', status: 'string' },
    sortableFields: ['createdAt', 'updatedAt', 'title'],
    defaultSort: { createdAt: -1 },
    dateFields: ['createdAt', 'updatedAt'],
    validator: baseSchema(['projectId', 'title', 'description', 'preconditions', 'steps', 'expectedResult', 'status', 'linkedWorkItemIds'], {
      projectId: stringField(120),
      suiteId: optionalStringField(120),
      title: stringField(240),
      description: { bsonType: 'string', maxLength: 12000 },
      preconditions: { bsonType: 'string', maxLength: 6000 },
      steps: { bsonType: 'string', maxLength: 12000 },
      expectedResult: { bsonType: 'string', maxLength: 6000 },
      status: { enum: ['draft', 'ready', 'deprecated'] },
      linkedWorkItemIds: {
        bsonType: 'array',
        maxItems: 100,
        items: { bsonType: 'string', maxLength: 120 },
      },
    }),
    indexes: [
      { key: { projectId: 1, suiteId: 1, createdAt: -1 }, name: 'project_suite_createdAt' },
    ],
    normalizeCreate(input) {
      const payload = asPlainObject(input, 'test case');
      return {
        projectId: asRequiredString(payload.projectId, 'projectId', 120),
        suiteId: asOptionalString(payload.suiteId, 'suiteId', 120),
        title: asRequiredString(payload.title, 'title', 240),
        description: asString(payload.description, 'description', 12000, ''),
        preconditions: asString(payload.preconditions, 'preconditions', 6000, ''),
        steps: asString(payload.steps, 'steps', 12000, ''),
        expectedResult: asString(payload.expectedResult, 'expectedResult', 6000, ''),
        status: asEnum(payload.status, 'status', ['draft', 'ready', 'deprecated'], 'draft'),
        linkedWorkItemIds: asStringArray(payload.linkedWorkItemIds, 'linkedWorkItemIds', 100, 120),
      };
    },
    normalizeUpdate(input) {
      const payload = asPlainObject(input, 'test case update');
      const set = {};
      const unset = [];

      if (hasOwn(payload, 'suiteId')) {
        const value = asOptionalString(payload.suiteId, 'suiteId', 120);
        if (value) set.suiteId = value;
        else unset.push('suiteId');
      }
      if (hasOwn(payload, 'title')) set.title = asRequiredString(payload.title, 'title', 240);
      if (hasOwn(payload, 'description')) set.description = asString(payload.description, 'description', 12000, '');
      if (hasOwn(payload, 'preconditions')) set.preconditions = asString(payload.preconditions, 'preconditions', 6000, '');
      if (hasOwn(payload, 'steps')) set.steps = asString(payload.steps, 'steps', 12000, '');
      if (hasOwn(payload, 'expectedResult')) set.expectedResult = asString(payload.expectedResult, 'expectedResult', 6000, '');
      if (hasOwn(payload, 'status')) set.status = asEnum(payload.status, 'status', ['draft', 'ready', 'deprecated']);
      if (hasOwn(payload, 'linkedWorkItemIds')) set.linkedWorkItemIds = asStringArray(payload.linkedWorkItemIds, 'linkedWorkItemIds', 100, 120);

      return finalizeUpdate(set, unset);
    },
  },
  testSuites: {
    filters: { projectId: 'string', parentId: 'string' },
    sortableFields: ['createdAt', 'updatedAt', 'name'],
    defaultSort: { createdAt: 1 },
    dateFields: ['createdAt', 'updatedAt'],
    validator: baseSchema(['projectId', 'name'], {
      projectId: stringField(120),
      name: stringField(160),
      parentId: optionalStringField(120),
    }),
    indexes: [
      { key: { projectId: 1, createdAt: 1 }, name: 'project_createdAt' },
    ],
    normalizeCreate(input) {
      const payload = asPlainObject(input, 'test suite');
      return {
        projectId: asRequiredString(payload.projectId, 'projectId', 120),
        name: asRequiredString(payload.name, 'name', 160),
        parentId: asOptionalString(payload.parentId, 'parentId', 120),
      };
    },
    normalizeUpdate(input) {
      const payload = asPlainObject(input, 'test suite update');
      const set = {};
      const unset = [];

      if (hasOwn(payload, 'name')) set.name = asRequiredString(payload.name, 'name', 160);
      if (hasOwn(payload, 'parentId')) {
        const value = asOptionalString(payload.parentId, 'parentId', 120);
        if (value) set.parentId = value;
        else unset.push('parentId');
      }

      return finalizeUpdate(set, unset);
    },
  },
  todos: {
    filters: { userId: 'string', isCompleted: 'boolean', priority: 'string', category: 'string' },
    sortableFields: ['createdAt', 'updatedAt', 'deadline'],
    defaultSort: { createdAt: -1 },
    dateFields: ['deadline', 'createdAt', 'updatedAt'],
    validator: baseSchema(['userId', 'title', 'deadline', 'reminderDays', 'reminderSent', 'isCompleted'], {
      userId: stringField(120),
      title: stringField(240),
      deadline: { bsonType: 'date' },
      reminderDays: numberField({ minimum: 0, maximum: 365 }),
      reminderSent: { bsonType: 'bool' },
      isCompleted: { bsonType: 'bool' },
      priority: { enum: ['low', 'medium', 'high', 'urgent'] },
      category: optionalStringField(80),
      emailNotification: { bsonType: 'bool' },
      color: optionalStringField(40),
      icon: optionalStringField(40),
      completionNotes: { bsonType: 'string', maxLength: 4000 },
    }),
    indexes: [
      { key: { userId: 1, createdAt: -1 }, name: 'user_createdAt' },
      { key: { userId: 1, deadline: 1 }, name: 'user_deadline' },
      { key: { userId: 1, isCompleted: 1 }, name: 'user_completed' },
    ],
    normalizeCreate(input) {
      const payload = asPlainObject(input, 'todo');
      return {
        userId: asRequiredString(payload.userId, 'userId', 120),
        title: asRequiredString(payload.title, 'title', 240),
        deadline: asDate(payload.deadline, 'deadline'),
        reminderDays: asNumber(payload.reminderDays, 'reminderDays', 0, { min: 0, max: 365, integer: true }),
        reminderSent: asBoolean(payload.reminderSent, 'reminderSent', false),
        isCompleted: asBoolean(payload.isCompleted, 'isCompleted', false),
        priority: asEnum(payload.priority, 'priority', ['low', 'medium', 'high', 'urgent'], 'medium'),
        category: asOptionalString(payload.category, 'category', 80),
        emailNotification: asBoolean(payload.emailNotification, 'emailNotification', false),
        color: asOptionalString(payload.color, 'color', 40),
        icon: asOptionalString(payload.icon, 'icon', 40),
        completionNotes: asString(payload.completionNotes, 'completionNotes', 4000, ''),
      };
    },
    normalizeUpdate(input) {
      const payload = asPlainObject(input, 'todo update');
      const set = {};
      const unset = [];

      if (hasOwn(payload, 'title')) set.title = asRequiredString(payload.title, 'title', 240);
      if (hasOwn(payload, 'deadline')) set.deadline = asDate(payload.deadline, 'deadline');
      if (hasOwn(payload, 'reminderDays')) set.reminderDays = asNumber(payload.reminderDays, 'reminderDays', undefined, { min: 0, max: 365, integer: true });
      if (hasOwn(payload, 'reminderSent')) set.reminderSent = asBoolean(payload.reminderSent, 'reminderSent');
      if (hasOwn(payload, 'isCompleted')) set.isCompleted = asBoolean(payload.isCompleted, 'isCompleted');
      if (hasOwn(payload, 'priority')) set.priority = asEnum(payload.priority, 'priority', ['low', 'medium', 'high', 'urgent']);
      if (hasOwn(payload, 'category')) {
        const value = asOptionalString(payload.category, 'category', 80);
        if (value) set.category = value;
        else unset.push('category');
      }
      if (hasOwn(payload, 'emailNotification')) set.emailNotification = asBoolean(payload.emailNotification, 'emailNotification');
      if (hasOwn(payload, 'color')) {
        const value = asOptionalString(payload.color, 'color', 40);
        if (value) set.color = value;
        else unset.push('color');
      }
      if (hasOwn(payload, 'icon')) {
        const value = asOptionalString(payload.icon, 'icon', 40);
        if (value) set.icon = value;
        else unset.push('icon');
      }
      if (hasOwn(payload, 'completionNotes')) set.completionNotes = asString(payload.completionNotes, 'completionNotes', 4000, '');

      return finalizeUpdate(set, unset);
    },
  },
  notifications: {
    filters: { userId: 'string', read: 'boolean', type: 'string' },
    sortableFields: ['createdAt'],
    defaultSort: { createdAt: -1 },
    dateFields: ['createdAt', 'updatedAt', 'readAt'],
    validator: baseSchema(['userId', 'title', 'message', 'type', 'read'], {
      userId: stringField(120),
      title: stringField(200),
      message: stringField(2000),
      type: { enum: ['mention', 'assignment', 'status_change', 'system'] },
      read: { bsonType: 'bool' },
      link: optionalStringField(500),
      readAt: { bsonType: 'date' },
    }),
    indexes: [
      { key: { userId: 1, createdAt: -1 }, name: 'user_createdAt' },
      { key: { userId: 1, read: 1, createdAt: -1 }, name: 'user_read_createdAt' },
    ],
    normalizeCreate(input) {
      const payload = asPlainObject(input, 'notification');
      const read = asBoolean(payload.read, 'read', false);
      return {
        userId: asRequiredString(payload.userId, 'userId', 120),
        title: asRequiredString(payload.title, 'title', 200),
        message: asRequiredString(payload.message, 'message', 2000),
        type: asEnum(payload.type, 'type', ['mention', 'assignment', 'status_change', 'system'], 'system'),
        read,
        link: asOptionalString(payload.link, 'link', 500),
        readAt: read ? new Date() : undefined,
      };
    },
    normalizeUpdate(input) {
      const payload = asPlainObject(input, 'notification update');
      const set = {};
      const unset = [];

      if (hasOwn(payload, 'read')) {
        const read = asBoolean(payload.read, 'read');
        set.read = read;
        if (read) set.readAt = new Date();
        else unset.push('readAt');
      }
      if (hasOwn(payload, 'link')) {
        const value = asOptionalString(payload.link, 'link', 500);
        if (value) set.link = value;
        else unset.push('link');
      }

      return finalizeUpdate(set, unset);
    },
  },
  sprints: {
    filters: { projectId: 'string', status: 'string' },
    sortableFields: ['startDate', 'endDate', 'createdAt'],
    defaultSort: { startDate: 1 },
    dateFields: ['startDate', 'endDate', 'createdAt', 'updatedAt'],
    validator: baseSchema(['projectId', 'name', 'startDate', 'endDate', 'status'], {
      projectId: stringField(120),
      name: stringField(160),
      startDate: { bsonType: 'date' },
      endDate: { bsonType: 'date' },
      status: { enum: ['planned', 'active', 'completed'] },
    }),
    indexes: [
      { key: { projectId: 1, startDate: 1 }, name: 'project_startDate' },
      { key: { projectId: 1, status: 1 }, name: 'project_status' },
    ],
    normalizeCreate(input) {
      const payload = asPlainObject(input, 'sprint');
      return {
        projectId: asRequiredString(payload.projectId, 'projectId', 120),
        name: asRequiredString(payload.name, 'name', 160),
        startDate: asDate(payload.startDate, 'startDate'),
        endDate: asDate(payload.endDate, 'endDate'),
        status: asEnum(payload.status, 'status', ['planned', 'active', 'completed'], 'planned'),
      };
    },
    normalizeUpdate(input) {
      const payload = asPlainObject(input, 'sprint update');
      const set = {};

      if (hasOwn(payload, 'name')) set.name = asRequiredString(payload.name, 'name', 160);
      if (hasOwn(payload, 'startDate')) set.startDate = asDate(payload.startDate, 'startDate');
      if (hasOwn(payload, 'endDate')) set.endDate = asDate(payload.endDate, 'endDate');
      if (hasOwn(payload, 'status')) set.status = asEnum(payload.status, 'status', ['planned', 'active', 'completed']);

      return finalizeUpdate(set);
    },
  },
  notes: {
    filters: { userId: 'string', type: 'string' },
    sortableFields: ['updatedAt', 'createdAt', 'title'],
    defaultSort: { updatedAt: -1 },
    dateFields: ['createdAt', 'updatedAt'],
    validator: baseSchema(['userId', 'title', 'content'], {
      userId: stringField(120),
      title: stringField(240),
      content: { bsonType: 'string', maxLength: 500000 },
      type: { enum: ['text', 'whiteboard'] },
      whiteboardData: { bsonType: 'string', maxLength: 2000000 },
    }),
    indexes: [
      { key: { userId: 1, updatedAt: -1 }, name: 'user_updatedAt' },
      { key: { title: 'text', content: 'text' }, name: 'notes_text_search' },
    ],
    normalizeCreate(input) {
      const payload = asPlainObject(input, 'note');
      return {
        userId: asRequiredString(payload.userId, 'userId', 120),
        title: asRequiredString(payload.title, 'title', 240),
        content: asString(payload.content, 'content', 500000, ''),
        type: asEnum(payload.type, 'type', ['text', 'whiteboard'], 'text'),
        whiteboardData: asOptionalString(payload.whiteboardData, 'whiteboardData', 2000000),
      };
    },
    normalizeUpdate(input) {
      const payload = asPlainObject(input, 'note update');
      const set = {};
      const unset = [];

      if (hasOwn(payload, 'title')) set.title = asRequiredString(payload.title, 'title', 240);
      if (hasOwn(payload, 'content')) set.content = asString(payload.content, 'content', 500000, '');
      if (hasOwn(payload, 'type')) set.type = asEnum(payload.type, 'type', ['text', 'whiteboard']);
      if (hasOwn(payload, 'whiteboardData')) {
        const value = asOptionalString(payload.whiteboardData, 'whiteboardData', 2000000);
        if (value) set.whiteboardData = value;
        else unset.push('whiteboardData');
      }

      return finalizeUpdate(set, unset);
    },
  },
  habits: {
    filters: { userId: 'string' },
    sortableFields: ['createdAt', 'updatedAt', 'title'],
    defaultSort: { createdAt: -1 },
    dateFields: ['createdAt', 'updatedAt'],
    validator: baseSchema(['userId', 'title', 'history', 'currentStreak', 'longestStreak'], {
      userId: stringField(120),
      title: stringField(160),
      description: { bsonType: 'string', maxLength: 2000 },
      color: optionalStringField(40),
      icon: optionalStringField(40),
      history: {
        bsonType: 'array',
        maxItems: 2000,
        items: { bsonType: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
      },
      currentStreak: numberField({ minimum: 0 }),
      longestStreak: numberField({ minimum: 0 }),
    }),
    indexes: [
      { key: { userId: 1, createdAt: -1 }, name: 'user_createdAt' },
    ],
    normalizeCreate(input) {
      const payload = asPlainObject(input, 'habit');
      return {
        userId: asRequiredString(payload.userId, 'userId', 120),
        title: asRequiredString(payload.title, 'title', 160),
        description: asString(payload.description, 'description', 2000, ''),
        color: asOptionalString(payload.color, 'color', 40),
        icon: asOptionalString(payload.icon, 'icon', 40),
        history: asStringArray(payload.history, 'history', 2000, 10).filter((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry)),
        currentStreak: asNumber(payload.currentStreak, 'currentStreak', 0, { min: 0, integer: true }),
        longestStreak: asNumber(payload.longestStreak, 'longestStreak', 0, { min: 0, integer: true }),
      };
    },
    normalizeUpdate(input) {
      const payload = asPlainObject(input, 'habit update');
      const set = {};
      const unset = [];

      if (hasOwn(payload, 'title')) set.title = asRequiredString(payload.title, 'title', 160);
      if (hasOwn(payload, 'description')) set.description = asString(payload.description, 'description', 2000, '');
      if (hasOwn(payload, 'color')) {
        const value = asOptionalString(payload.color, 'color', 40);
        if (value) set.color = value;
        else unset.push('color');
      }
      if (hasOwn(payload, 'icon')) {
        const value = asOptionalString(payload.icon, 'icon', 40);
        if (value) set.icon = value;
        else unset.push('icon');
      }
      if (hasOwn(payload, 'history')) {
        set.history = asStringArray(payload.history, 'history', 2000, 10).filter((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry));
      }
      if (hasOwn(payload, 'currentStreak')) set.currentStreak = asNumber(payload.currentStreak, 'currentStreak', undefined, { min: 0, integer: true });
      if (hasOwn(payload, 'longestStreak')) set.longestStreak = asNumber(payload.longestStreak, 'longestStreak', undefined, { min: 0, integer: true });

      return finalizeUpdate(set, unset);
    },
  },
  snippets: {
    filters: { userId: 'string', language: 'string' },
    sortableFields: ['createdAt', 'updatedAt', 'title'],
    defaultSort: { createdAt: -1 },
    dateFields: ['createdAt', 'updatedAt'],
    validator: baseSchema(['userId', 'title', 'code', 'language', 'tags'], {
      userId: stringField(120),
      title: stringField(200),
      code: { bsonType: 'string', maxLength: 500000 },
      language: stringField(80),
      tags: {
        bsonType: 'array',
        maxItems: 100,
        items: { bsonType: 'string', maxLength: 80 },
      },
      urls: {
        bsonType: 'array',
        maxItems: 100,
        items: { bsonType: 'string', maxLength: 500 },
      },
      keys: {
        bsonType: 'array',
        maxItems: 100,
        items: { bsonType: 'string', maxLength: 160 },
      },
    }),
    indexes: [
      { key: { userId: 1, createdAt: -1 }, name: 'user_createdAt' },
      { key: { title: 'text', code: 'text', tags: 'text' }, name: 'snippets_text_search' },
    ],
    normalizeCreate(input) {
      const payload = asPlainObject(input, 'snippet');
      return {
        userId: asRequiredString(payload.userId, 'userId', 120),
        title: asRequiredString(payload.title, 'title', 200),
        code: asRequiredString(payload.code, 'code', 500000),
        language: asRequiredString(payload.language, 'language', 80),
        tags: asStringArray(payload.tags, 'tags', 100, 80),
        urls: asStringArray(payload.urls, 'urls', 100, 500),
        keys: asStringArray(payload.keys, 'keys', 100, 160),
      };
    },
    normalizeUpdate(input) {
      const payload = asPlainObject(input, 'snippet update');
      const set = {};

      if (hasOwn(payload, 'title')) set.title = asRequiredString(payload.title, 'title', 200);
      if (hasOwn(payload, 'code')) set.code = asRequiredString(payload.code, 'code', 500000);
      if (hasOwn(payload, 'language')) set.language = asRequiredString(payload.language, 'language', 80);
      if (hasOwn(payload, 'tags')) set.tags = asStringArray(payload.tags, 'tags', 100, 80);
      if (hasOwn(payload, 'urls')) set.urls = asStringArray(payload.urls, 'urls', 100, 500);
      if (hasOwn(payload, 'keys')) set.keys = asStringArray(payload.keys, 'keys', 100, 160);

      return finalizeUpdate(set);
    },
  },
  assignments: {
    filters: { userId: 'string', subject: 'string', completed: 'boolean' },
    sortableFields: ['deadline', 'createdAt', 'updatedAt'],
    defaultSort: { deadline: 1 },
    dateFields: ['deadline', 'createdAt', 'updatedAt'],
    validator: baseSchema(['userId', 'title', 'subject', 'deadline', 'weighting', 'completed'], {
      userId: stringField(120),
      title: stringField(200),
      subject: stringField(120),
      deadline: { bsonType: 'date' },
      weighting: numberField({ minimum: 0, maximum: 1000 }),
      grade: numberField({ minimum: 0, maximum: 150 }),
      completed: { bsonType: 'bool' },
    }),
    indexes: [
      { key: { userId: 1, deadline: 1 }, name: 'user_deadline' },
      { key: { userId: 1, subject: 1 }, name: 'user_subject' },
    ],
    normalizeCreate(input) {
      const payload = asPlainObject(input, 'assignment');
      return {
        userId: asRequiredString(payload.userId, 'userId', 120),
        title: asRequiredString(payload.title, 'title', 200),
        subject: asRequiredString(payload.subject, 'subject', 120),
        deadline: asDate(payload.deadline, 'deadline'),
        weighting: asNumber(payload.weighting, 'weighting', 0, { min: 0, max: 1000 }),
        grade: asOptionalNumber(payload.grade, 'grade', { min: 0, max: 150 }),
        completed: asBoolean(payload.completed, 'completed', false),
      };
    },
    normalizeUpdate(input) {
      const payload = asPlainObject(input, 'assignment update');
      const set = {};
      const unset = [];

      if (hasOwn(payload, 'title')) set.title = asRequiredString(payload.title, 'title', 200);
      if (hasOwn(payload, 'subject')) set.subject = asRequiredString(payload.subject, 'subject', 120);
      if (hasOwn(payload, 'deadline')) set.deadline = asDate(payload.deadline, 'deadline');
      if (hasOwn(payload, 'weighting')) set.weighting = asNumber(payload.weighting, 'weighting', undefined, { min: 0, max: 1000 });
      if (hasOwn(payload, 'grade')) {
        const value = asOptionalNumber(payload.grade, 'grade', { min: 0, max: 150 });
        if (value !== undefined) set.grade = value;
        else unset.push('grade');
      }
      if (hasOwn(payload, 'completed')) set.completed = asBoolean(payload.completed, 'completed');

      return finalizeUpdate(set, unset);
    },
  },
  decks: {
    filters: { userId: 'string', sourceNoteId: 'string' },
    sortableFields: ['createdAt', 'updatedAt', 'title'],
    defaultSort: { createdAt: -1 },
    dateFields: ['createdAt', 'updatedAt'],
    validator: baseSchema(['userId', 'title', 'cards'], {
      userId: stringField(120),
      title: stringField(200),
      sourceNoteId: optionalStringField(120),
      cards: {
        bsonType: 'array',
        maxItems: 500,
        items: {
          bsonType: 'object',
          additionalProperties: false,
          required: ['front', 'back'],
          properties: {
            front: stringField(1000),
            back: stringField(4000),
          },
        },
      },
    }),
    indexes: [
      { key: { userId: 1, createdAt: -1 }, name: 'user_createdAt' },
      { key: { sourceNoteId: 1 }, name: 'sourceNote' },
    ],
    normalizeCreate(input) {
      const payload = asPlainObject(input, 'deck');
      return {
        userId: asRequiredString(payload.userId, 'userId', 120),
        title: asRequiredString(payload.title, 'title', 200),
        cards: asFlashcards(payload.cards),
        sourceNoteId: asOptionalString(payload.sourceNoteId, 'sourceNoteId', 120),
      };
    },
    normalizeUpdate(input) {
      const payload = asPlainObject(input, 'deck update');
      const set = {};
      const unset = [];

      if (hasOwn(payload, 'title')) set.title = asRequiredString(payload.title, 'title', 200);
      if (hasOwn(payload, 'cards')) set.cards = asFlashcards(payload.cards);
      if (hasOwn(payload, 'sourceNoteId')) {
        const value = asOptionalString(payload.sourceNoteId, 'sourceNoteId', 120);
        if (value) set.sourceNoteId = value;
        else unset.push('sourceNoteId');
      }

      return finalizeUpdate(set, unset);
    },
  },
  projectMembers: {
    filters: { projectId: 'string', userId: 'string', role: 'string' },
    sortableFields: ['createdAt', 'updatedAt', 'role'],
    defaultSort: { createdAt: 1 },
    dateFields: ['createdAt', 'updatedAt'],
    validator: baseSchema(['projectId', 'userId', 'role', 'status'], {
      projectId: stringField(120),
      userId: stringField(120),
      role: { enum: ['owner', 'admin', 'member', 'viewer'] },
      status: { enum: ['active', 'invited', 'disabled'] },
      displayName: optionalStringField(160),
      email: optionalStringField(240),
    }),
    indexes: [
      { key: { projectId: 1, userId: 1 }, name: 'project_user_unique', unique: true },
      { key: { userId: 1, createdAt: 1 }, name: 'user_createdAt' },
    ],
    normalizeCreate(input) {
      const payload = asPlainObject(input, 'project member');
      return {
        projectId: asRequiredString(payload.projectId, 'projectId', 120),
        userId: asRequiredString(payload.userId, 'userId', 120),
        role: asEnum(payload.role, 'role', ['owner', 'admin', 'member', 'viewer'], 'member'),
        status: asEnum(payload.status, 'status', ['active', 'invited', 'disabled'], 'active'),
        displayName: asOptionalString(payload.displayName, 'displayName', 160),
        email: asOptionalString(payload.email, 'email', 240),
      };
    },
    normalizeUpdate(input) {
      const payload = asPlainObject(input, 'project member update');
      const set = {};
      const unset = [];

      if (hasOwn(payload, 'role')) set.role = asEnum(payload.role, 'role', ['owner', 'admin', 'member', 'viewer']);
      if (hasOwn(payload, 'status')) set.status = asEnum(payload.status, 'status', ['active', 'invited', 'disabled']);
      if (hasOwn(payload, 'displayName')) {
        const value = asOptionalString(payload.displayName, 'displayName', 160);
        if (value) set.displayName = value;
        else unset.push('displayName');
      }
      if (hasOwn(payload, 'email')) {
        const value = asOptionalString(payload.email, 'email', 240);
        if (value) set.email = value;
        else unset.push('email');
      }

      return finalizeUpdate(set, unset);
    },
  },
  users: {
    filters: { userId: 'string' },
    sortableFields: ['createdAt', 'updatedAt'],
    defaultSort: { createdAt: -1 },
    dateFields: ['createdAt', 'updatedAt'],
    validator: baseSchema(['userId'], {
      userId: stringField(120),
      displayName: optionalStringField(160),
      email: optionalStringField(240),
      photoURL: optionalStringField(2000),
      theme: { enum: ['light', 'dark'] },
      defaultView: optionalStringField(40),
      reminderLeadDays: numberField({ minimum: 1, maximum: 90 }),
    }),
    indexes: [
      { key: { userId: 1 }, name: 'userId_unique', unique: true },
    ],
    normalizeCreate(input) {
      const payload = asPlainObject(input, 'user');
      return {
        userId: asRequiredString(payload.userId, 'userId', 120),
        displayName: asOptionalString(payload.displayName, 'displayName', 160),
        email: asOptionalString(payload.email, 'email', 240),
        photoURL: asOptionalString(payload.photoURL, 'photoURL', 2000),
        theme: asEnum(payload.theme, 'theme', ['light', 'dark'], 'light'),
        defaultView: asOptionalString(payload.defaultView, 'defaultView', 40),
        reminderLeadDays: asNumber(payload.reminderLeadDays, 'reminderLeadDays', 7, { min: 1, max: 90, integer: true }),
      };
    },
    normalizeUpdate(input) {
      const payload = asPlainObject(input, 'user update');
      const set = {};
      const unset = [];

      if (hasOwn(payload, 'displayName')) {
        const value = asOptionalString(payload.displayName, 'displayName', 160);
        if (value) set.displayName = value;
        else unset.push('displayName');
      }
      if (hasOwn(payload, 'email')) {
        const value = asOptionalString(payload.email, 'email', 240);
        if (value) set.email = value;
        else unset.push('email');
      }
      if (hasOwn(payload, 'photoURL')) {
        const value = asOptionalString(payload.photoURL, 'photoURL', 2000);
        if (value) set.photoURL = value;
        else unset.push('photoURL');
      }
      if (hasOwn(payload, 'theme')) set.theme = asEnum(payload.theme, 'theme', ['light', 'dark']);
      if (hasOwn(payload, 'defaultView')) {
        const value = asOptionalString(payload.defaultView, 'defaultView', 40);
        if (value) set.defaultView = value;
        else unset.push('defaultView');
      }
      if (hasOwn(payload, 'reminderLeadDays')) {
        set.reminderLeadDays = asNumber(payload.reminderLeadDays, 'reminderLeadDays', undefined, { min: 1, max: 90, integer: true });
      }

      return finalizeUpdate(set, unset);
    },
  },
  subscriptions: {
    filters: { userId: 'string', status: 'string', category: 'string' },
    sortableFields: ['createdAt', 'updatedAt', 'renewalDate', 'name', 'amount'],
    defaultSort: { renewalDate: 1 },
    dateFields: ['renewalDate', 'expiryDate', 'createdAt', 'updatedAt'],
    validator: baseSchema(['userId', 'name', 'amount', 'currency', 'billingCycle', 'renewalDate', 'status'], {
      userId: stringField(120),
      name: stringField(160),
      category: { enum: ['streaming', 'software', 'utilities', 'gaming', 'other'] },
      amount: numberField({ minimum: 0 }),
      currency: stringField(8),
      billingCycle: { enum: ['weekly', 'monthly', 'quarterly', 'yearly'] },
      renewalDate: { bsonType: 'date' },
      expiryDate: { bsonType: 'date' },
      status: { enum: ['active', 'trial', 'cancelled', 'paused'] },
      paymentMethod: optionalStringField(120),
      manageUrl: optionalStringField(500),
      notes: optionalStringField(2000),
      reminderDaysBefore: numberField({ minimum: 1, maximum: 90 }),
    }),
    indexes: [
      { key: { userId: 1, renewalDate: 1 }, name: 'user_renewalDate' },
      { key: { userId: 1, status: 1 }, name: 'user_status' },
    ],
    normalizeCreate(input) {
      const payload = asPlainObject(input, 'subscription');
      return {
        userId: asRequiredString(payload.userId, 'userId', 120),
        name: asRequiredString(payload.name, 'name', 160),
        category: asEnum(payload.category, 'category', ['streaming', 'software', 'utilities', 'gaming', 'other'], 'other'),
        amount: asNumber(payload.amount, 'amount', 0, { min: 0 }),
        currency: asString(payload.currency, 'currency', 8, 'USD'),
        billingCycle: asEnum(payload.billingCycle, 'billingCycle', ['weekly', 'monthly', 'quarterly', 'yearly'], 'monthly'),
        renewalDate: asDate(payload.renewalDate, 'renewalDate'),
        expiryDate: asOptionalDate(payload.expiryDate, 'expiryDate'),
        status: asEnum(payload.status, 'status', ['active', 'trial', 'cancelled', 'paused'], 'active'),
        paymentMethod: asOptionalString(payload.paymentMethod, 'paymentMethod', 120),
        manageUrl: asOptionalString(payload.manageUrl, 'manageUrl', 500),
        notes: asString(payload.notes, 'notes', 2000, ''),
        reminderDaysBefore: asNumber(payload.reminderDaysBefore, 'reminderDaysBefore', 7, { min: 1, max: 90, integer: true }),
      };
    },
    normalizeUpdate(input) {
      const payload = asPlainObject(input, 'subscription update');
      const set = {};
      const unset = [];

      if (hasOwn(payload, 'name')) set.name = asRequiredString(payload.name, 'name', 160);
      if (hasOwn(payload, 'category')) set.category = asEnum(payload.category, 'category', ['streaming', 'software', 'utilities', 'gaming', 'other']);
      if (hasOwn(payload, 'amount')) set.amount = asNumber(payload.amount, 'amount', undefined, { min: 0 });
      if (hasOwn(payload, 'currency')) set.currency = asString(payload.currency, 'currency', 8, 'USD');
      if (hasOwn(payload, 'billingCycle')) set.billingCycle = asEnum(payload.billingCycle, 'billingCycle', ['weekly', 'monthly', 'quarterly', 'yearly']);
      if (hasOwn(payload, 'renewalDate')) set.renewalDate = asDate(payload.renewalDate, 'renewalDate');
      if (hasOwn(payload, 'expiryDate')) {
        const value = asOptionalDate(payload.expiryDate, 'expiryDate');
        if (value) set.expiryDate = value;
        else unset.push('expiryDate');
      }
      if (hasOwn(payload, 'status')) set.status = asEnum(payload.status, 'status', ['active', 'trial', 'cancelled', 'paused']);
      if (hasOwn(payload, 'paymentMethod')) {
        const value = asOptionalString(payload.paymentMethod, 'paymentMethod', 120);
        if (value) set.paymentMethod = value;
        else unset.push('paymentMethod');
      }
      if (hasOwn(payload, 'manageUrl')) {
        const value = asOptionalString(payload.manageUrl, 'manageUrl', 500);
        if (value) set.manageUrl = value;
        else unset.push('manageUrl');
      }
      if (hasOwn(payload, 'notes')) set.notes = asString(payload.notes, 'notes', 2000, '');
      if (hasOwn(payload, 'reminderDaysBefore')) {
        set.reminderDaysBefore = asNumber(payload.reminderDaysBefore, 'reminderDaysBefore', undefined, { min: 1, max: 90, integer: true });
      }

      return finalizeUpdate(set, unset);
    },
  },
};

export function getCollectionDefinition(name) {
  const definition = collectionDefinitions[name];
  if (!definition) {
    badRequest(`Unknown collection: ${name}.`);
  }
  return definition;
}

export function getSupportedCollections() {
  return Object.keys(collectionDefinitions);
}

function stripNullishFields(document) {
  const cleaned = { ...document };
  for (const [key, value] of Object.entries(cleaned)) {
    if (value === undefined || value === null) {
      delete cleaned[key];
    }
  }
  return cleaned;
}

export function buildInsertDocument(collectionName, payload) {
  const definition = getCollectionDefinition(collectionName);
  const now = new Date();
  return stripNullishFields({
    ...definition.normalizeCreate(payload),
    createdAt: now,
    updatedAt: now,
  });
}

export function buildUpdateDocument(collectionName, payload) {
  return getCollectionDefinition(collectionName).normalizeUpdate(payload);
}

export function getCollectionValidator(collectionName) {
  return getCollectionDefinition(collectionName).validator;
}

export function getCollectionIndexes(collectionName) {
  return getCollectionDefinition(collectionName).indexes ?? [];
}

export function buildListQuery(collectionName, query) {
  const definition = getCollectionDefinition(collectionName);
  const filter = {};

  for (const [field, type] of Object.entries(definition.filters ?? {})) {
    if (!hasOwn(query, field)) {
      continue;
    }
    const rawValue = query[field];
    if (rawValue === undefined || rawValue === '') {
      continue;
    }
    if (type === 'boolean') {
      filter[field] = rawValue === 'true';
    } else if (type === 'number') {
      filter[field] = Number(rawValue);
    } else {
      filter[field] = String(rawValue);
    }
  }

  const sortField = definition.sortableFields?.includes(query.sort) ? query.sort : Object.keys(definition.defaultSort)[0];
  const sortDirection = String(query.order).toLowerCase() === 'asc' ? 1 : -1;
  const sort = query.sort && definition.sortableFields?.includes(query.sort)
    ? { [sortField]: sortDirection }
    : definition.defaultSort;

  const limitCandidate = Number(query.limit);
  const limit = Number.isFinite(limitCandidate) && limitCandidate > 0
    ? Math.min(limitCandidate, MAX_LIST_LIMIT)
    : 200;

  return { filter, sort, limit };
}
