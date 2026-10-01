import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

/**
 * Regex matching dates in the format returned by the backend: dd/MM/yyyy HH:mm
 * Examples: "10/04/2026 16:14"
 */
const DATE_PATTERN = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/;

/**
 * Converts "dd/MM/yyyy HH:mm" → ISO 8601 "yyyy-MM-ddTHH:mm:00"
 * so Angular's DatePipe and new Date() parse it correctly.
 */
function toIso(value: string): string {
  const [datePart, timePart] = value.split(' ');
  const [day, month, year]   = datePart.split('/');
  return `${year}-${month}-${day}T${timePart}:00`;
}

/** Recursively walk any object/array and normalize date strings in-place. */
function normalizeDates(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return DATE_PATTERN.test(obj) ? toIso(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(normalizeDates);
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj as object)) {
      result[key] = normalizeDates((obj as Record<string, unknown>)[key]);
    }
    return result;
  }

  return obj;
}

export const dateNormalizerInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    map(event => {
      if (event instanceof HttpResponse && event.body) {
        // Skip binary responses — only normalize plain JSON objects/arrays
        if (event.body instanceof Blob || event.body instanceof ArrayBuffer) {
          return event;
        }
        return event.clone({ body: normalizeDates(event.body) });
      }
      return event;
    }),
  );
