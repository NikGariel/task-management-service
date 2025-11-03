export class DueDate {
  private constructor(public readonly value: Date) {}

  static create(date: Date): DueDate {
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date provided");
    }
    return new DueDate(date);
  }

  static fromDate(date: Date): DueDate {
    return new DueDate(date);
  }

  static fromString(dateString: string): DueDate {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date string: ${dateString}`);
    }
    return new DueDate(date);
  }

  isInPast(): boolean {
    return this.value.getTime() < Date.now();
  }

  isWithinHours(hours: number): boolean {
    const now = Date.now();
    const dueTime = this.value.getTime();
    const hoursInMs = hours * 60 * 60 * 1000;
    return dueTime - now <= hoursInMs && dueTime > now;
  }

  equals(other: DueDate): boolean {
    return this.value.getTime() === other.value.getTime();
  }
}

