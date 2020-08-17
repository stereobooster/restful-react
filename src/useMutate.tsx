import merge from "lodash/merge";
import { useCallback, useContext } from "react";
import { Context } from "./Context";
import { Omit, resolvePath, UseGetProps, GetState } from "./useGet";
import { useFetch, FetchRequest } from "./useFetch";

export type MutateMethod<TData, TRequestBody, TQueryParams, TPathParams> = (
  data: TRequestBody,
  mutateRequestOptions?: MutateRequestOptions<TQueryParams, TPathParams>,
) => Promise<TData>;

/**
 * State for the <Mutate /> component. These
 * are implementation details and should be
 * hidden from any consumers.
 */
export interface MutateState<TData, TError> {
  error: GetState<TData, TError>["error"];
  loading: boolean;
}

export interface MutateRequestOptions<TQueryParams, TPathParams> extends RequestInit {
  /**
   * Query parameters
   */
  queryParams?: TQueryParams;
  /**
   * Path parameters
   */
  pathParams?: TPathParams;
}

export interface UseMutateProps<TData, TError, TQueryParams, TRequestBody, TPathParams>
  extends Omit<UseGetProps<TData, TError, TQueryParams, TPathParams>, "lazy" | "debounce" | "mock"> {
  /**
   * What HTTP verb are we using?
   */
  verb: "POST" | "PUT" | "PATCH" | "DELETE";
  /**
   * Callback called after the mutation is done.
   *
   * @param body - Body given to mutate
   * @param data - Response data
   */
  onMutate?: (body: TRequestBody, data: TData) => void;
  /**
   * Developer mode
   * Override the state with some mocks values and avoid to fetch
   */
  mock?: {
    mutate?: MutateMethod<TData, TRequestBody, TQueryParams, TPathParams>;
    loading?: boolean;
  };
}

export interface UseMutateReturn<TData, TError, TRequestBody, TQueryParams, TPathParams>
  extends MutateState<TData, TError> {
  /**
   * Cancel the current fetch
   */
  cancel: () => void;
  /**
   * Call the mutate endpoint
   */
  mutate: MutateMethod<TData, TRequestBody, TQueryParams, TPathParams>;
}

export function useMutate<
  TData = any,
  TError = any,
  TQueryParams = { [key: string]: any },
  TRequestBody = any,
  TPathParams = unknown
>(
  props: UseMutateProps<TData, TError, TQueryParams, TRequestBody, TPathParams>,
): UseMutateReturn<TData, TError, TRequestBody, TQueryParams, TPathParams>;

export function useMutate<
  TData = any,
  TError = any,
  TQueryParams = { [key: string]: any },
  TRequestBody = any,
  TPathParams = unknown
>(
  verb: UseMutateProps<TData, TError, TQueryParams, TRequestBody, TPathParams>["verb"],
  path: UseMutateProps<TData, TError, TQueryParams, TRequestBody, TPathParams>["path"],
  props?: Omit<UseMutateProps<TData, TError, TQueryParams, TRequestBody, TPathParams>, "path" | "verb">,
): UseMutateReturn<TData, TError, TRequestBody, TQueryParams, TPathParams>;

export function useMutate<
  TData = any,
  TError = any,
  TQueryParams = { [key: string]: any },
  TRequestBody = any,
  TPathParams = unknown
>(): UseMutateReturn<TData, TError, TRequestBody, TQueryParams, TPathParams> {
  const props: UseMutateProps<TData, TError, TQueryParams, TRequestBody, TPathParams> =
    typeof arguments[0] === "object" ? arguments[0] : { ...arguments[2], path: arguments[1], verb: arguments[0] };

  const context = useContext(Context);
  const { verb, base = context.base, path, queryParams = {}, resolve, pathParams = {} } = props;
  const isDelete = verb === "DELETE";

  const { error, loading, execute, cancel } = useFetch(base, {}, []);

  const mutate = useCallback<MutateMethod<TData, TRequestBody, TQueryParams, TPathParams>>(
    async (body: TRequestBody, mutateRequestOptions?: MutateRequestOptions<TQueryParams, TPathParams>) => {
      const pathStr =
        typeof path === "function" ? path(mutateRequestOptions?.pathParams || (pathParams as TPathParams)) : path;

      const pathParts = [pathStr];

      const propsRequestOptions =
        (typeof props.requestOptions === "function" ? await props.requestOptions() : props.requestOptions) || {};

      const contextRequestOptions =
        (typeof context.requestOptions === "function" ? await context.requestOptions() : context.requestOptions) || {};

      const options: FetchRequest = {
        method: verb,
      };

      // don't set content-type when body is of type FormData
      if (!(body instanceof FormData)) {
        options.headers = { "content-type": typeof body === "object" ? "application/json" : "text/plain" };
      }

      if (body instanceof FormData) {
        options.body = body;
      } else if (typeof body === "object") {
        options.body = JSON.stringify(body);
      } else if (isDelete) {
        pathParts.push((body as unknown) as string);
      } else {
        options.body = (body as unknown) as string;
      }

      merge(options, contextRequestOptions, options, propsRequestOptions, mutateRequestOptions);

      return execute({
        path: resolvePath(
          base,
          pathParts.join("/"),
          { ...context.queryParams, ...queryParams, ...mutateRequestOptions?.queryParams },
          { ...context.queryParamStringifyOptions, ...props.queryParamStringifyOptions },
        ),
        ...options,
      }).then(rawData => (resolve ? resolve(rawData) : rawData));
    },
    [base, context.requestOptions, context.resolve, path],
  );

  return {
    error,
    loading,
    mutate,
    ...props.mock,
    cancel,
  };
}
