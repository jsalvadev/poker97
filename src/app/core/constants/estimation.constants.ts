export const TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL'] as const;
export const FIBONACCI_NUMBERS = [1, 2, 3, 5, 8, 13, 21] as const;

export type TshirtSize = typeof TSHIRT_SIZES[number];
export type FibonacciNumber = typeof FIBONACCI_NUMBERS[number];
