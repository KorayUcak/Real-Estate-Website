import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Koşullu sınıf birleştirici.
 *
 * Yalnız `clsx` yetmez: bir bileşen `px-6` verip çağıran taraf `px-10`
 * geçtiğinde ikisi de sınıf listesinde kalır ve kazananı CSS dosyasındaki
 * sıra belirler — yani rastgele. `twMerge` çakışan Tailwind sınıflarından
 * sonuncuyu bırakır, böylece `className` prop'u her zaman ezici olur.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
