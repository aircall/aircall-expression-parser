export const getAsMock = <T>(fn: T): jest.Mock<T> => fn as unknown as jest.Mock<T>;
