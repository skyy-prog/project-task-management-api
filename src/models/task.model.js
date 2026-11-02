const mongoose = require('mongoose');
const { TASK_STATUSES, TASK_PRIORITIES } = require('../constants');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: 'todo',
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: 'medium',
    },
    projectId: {
      type: Number,
      required: [true, 'Project id is required'],
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'Project id must be an integer',
      },
    },
    userId: {
      type: Number,
      required: [true, 'User id is required'],
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'User id must be an integer',
      },
    },
    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ userId: 1, projectId: 1, status: 1, priority: 1 });

taskSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Task', taskSchema);
