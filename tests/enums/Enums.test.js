'use strict';

const Enums = require('@enums');

describe('Enums Registry', () => {
  test('exports all core domain enums', () => {
    expect(Enums.PlatformType).toBeDefined();
    expect(Enums.NotificationStatus).toBeDefined();
    expect(Enums.NotificationSeverity).toBeDefined();
    expect(Enums.ScheduleRepeatType).toBeDefined();
    expect(Enums.AgentRunStatus).toBeDefined();
    expect(Enums.LearningProgressStatus).toBeDefined();
    expect(Enums.DifficultyLevel).toBeDefined();
    expect(Enums.MessageRole).toBeDefined();
    expect(Enums.ErrorCode).toBeDefined();
    expect(Enums.UserRole).toBeDefined();
  });

  test('all enum objects are frozen and immutable', () => {
    expect(Object.isFrozen(Enums.PlatformType)).toBe(true);
    expect(Object.isFrozen(Enums.NotificationStatus)).toBe(true);
    expect(Object.isFrozen(Enums.NotificationSeverity)).toBe(true);
    expect(Object.isFrozen(Enums.ScheduleRepeatType)).toBe(true);
    expect(Object.isFrozen(Enums.AgentRunStatus)).toBe(true);
    expect(Object.isFrozen(Enums.LearningProgressStatus)).toBe(true);
    expect(Object.isFrozen(Enums.DifficultyLevel)).toBe(true);
    expect(Object.isFrozen(Enums.MessageRole)).toBe(true);
    expect(Object.isFrozen(Enums.ErrorCode)).toBe(true);
  });

  test('UserRole contains student role', () => {
    expect(Enums.UserRole.STUDENT).toBe('student');
    expect(Enums.UserRole.ADMIN).toBe('admin');
    expect(Enums.UserRole.USER).toBe('user');
  });

  test('PlatformType matches supported channels', () => {
    expect(Enums.PlatformType.DISCORD).toBe('discord');
    expect(Enums.PlatformType.TELEGRAM).toBe('telegram');
    expect(Enums.PlatformType.WEB).toBe('web');
  });

  test('NotificationStatus and Severity match schema specifications', () => {
    expect(Enums.NotificationStatus.PENDING).toBe('pending');
    expect(Enums.NotificationStatus.SENT).toBe('sent');
    expect(Enums.NotificationStatus.FAILED).toBe('failed');

    expect(Enums.NotificationSeverity.INFO).toBe('info');
    expect(Enums.NotificationSeverity.SUCCESS).toBe('success');
    expect(Enums.NotificationSeverity.WARNING).toBe('warning');
    expect(Enums.NotificationSeverity.CRITICAL).toBe('critical');
  });
});
