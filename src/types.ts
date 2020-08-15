// Shared types across exported components and utils
//
/**
 * A function that resolves returned data from
 * a fetch call.
 */
export type ResolveFunctionPrimise<T> = ((data: any) => T) | ((data: any) => Promise<T>);

export interface GetDataError<TError> {
  message: string;
  data: TError | string;
}

/**
 * A function that resolves returned data from
 * a fetch call.
 */
export type ResolveFunction<TData> = (data: any) => TData;
