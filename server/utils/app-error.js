export default class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
