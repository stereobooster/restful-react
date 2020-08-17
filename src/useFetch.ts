import { useEffect, useRef, useState, useCallback } from "react";
import { processResponse } from "./util/processResponse";

/** This Fetch API interface represents a resource request - based on RequestInit */
export type FetchRequest = {
  /**
   * Returns request's HTTP method, which is "GET" by default.
   */
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE" | "HEAD";
  /**
   * Returns a Headers object consisting of the headers associated with request. Note that headers added in the network layer by the user agent will not be accounted for in this object, e.g., the "Host" header.
   */
  headers?: { [key: string]: string };
  /**
   * Returns the credentials mode associated with request, which is a string indicating whether credentials will be sent with the request always, never, or only when sent to a same-origin URL.
   */
  credentials?: RequestCredentials;
  /**
   * Returns the mode associated with request, which is a string indicating whether the request will use CORS, or will be restricted to same-origin URLs.
   */
  mode?: RequestMode;
  /**
   * Returns the cache mode associated with request, which is a string indicating how the request will interact with the browser's cache when fetching.
   */
  cache?: RequestCache;
  /**
   * A BodyInit object or null to set request's body.
   */
  body?: Record<string, any> | string; // BodyInit | null;
  //   /**
  //    * Returns the signal associated with request, which is an AbortSignal object indicating whether or not request has been aborted, and its abort event handler.
  //    */
  //   signal?: AbortSignal;
  //   /**
  //    * Returns the kind of resource requested by request, e.g., "document" or "script".
  //    */
  //   destination?: RequestDestination;
  //   /**
  //    * Returns request's subresource integrity metadata, which is a cryptographic hash of the resource being fetched. Its value consists of multiple hashes separated by whitespace. [SRI]
  //    */
  //   integrity: string;
  //   /**
  //    * Returns a boolean indicating whether or not request is for a history navigation (a.k.a. back-foward navigation).
  //    */
  //   isHistoryNavigation?: boolean;
  //   /**
  //    * Returns a boolean indicating whether or not request is for a reload navigation.
  //    */
  //   isReloadNavigation?: boolean;
  //   /**
  //    * Returns a boolean indicating whether or not request can outlive the global in which it was created.
  //    */
  //   keepalive?: boolean;
  //   /**
  //    * Returns the redirect mode associated with request, which is a string indicating how redirects for the request will be handled during fetching. A request will follow redirects by default.
  //    */
  //   redirect?: RequestRedirect;
  //   /**
  //    * Returns the referrer of request. Its value can be a same-origin URL if explicitly set in init, the empty string to indicate no referrer, and "about:client" when defaulting to the global's default. This is used during fetching to determine the value of the `Referer` header of the request being made.
  //    */
  //   referrer?: string;
  //   /**
  //    * Returns the referrer policy associated with request. This is used during fetching to compute the value of the request's referrer.
  //    */
  //   referrerPolicy?: ReferrerPolicy;
};

type Callbacks = {
  onError?: (e: any) => void;
};

export const useFetch = (url: string, useOptions: FetchRequest & Callbacks = {}, dependencies: any[] = []) => {
  const { onError, ...useFetchOptions } = useOptions;
  const refAbortController = useRef<AbortController>();
  const deferred = dependencies === undefined;
  const [state, setState] = useState<{ data: any; loading: boolean; error: any }>({
    data: null,
    loading: !deferred,
    error: null,
  });

  const cancel = useCallback(() => {
    setState(() => ({
      data: null,
      error: null,
      loading: false,
    }));
    refAbortController.current?.abort();
  }, []);

  const execute = useCallback(async (executeOptions: FetchRequest & { path?: string } = {}) => {
    const { body = useFetchOptions.body, path, ...executeFetchOptions } = executeOptions;
    try {
      setState({
        data: null,
        loading: true,
        error: null,
      });
      refAbortController.current?.abort();
      refAbortController.current = new AbortController();

      const response = await fetch(`${url}${path || ""}`, {
        ...useFetchOptions,
        ...executeFetchOptions,
        headers: {
          ...useFetchOptions.headers,
          ...executeFetchOptions.headers,
        },
        body: typeof body === "object" ? JSON.stringify(body) : body,
        signal: refAbortController.current.signal,
      });

      const { data, responseError } = await processResponse(response);

      if (refAbortController.current.signal.aborted) {
        return;
      }

      if (!response.ok || responseError) {
        throw {
          data,
          message: `Failed to fetch: ${response.status} ${response.statusText}`,
          status: response.status,
        };
      }

      setState({ data, loading: false, error: null });

      return data;
    } catch (e) {
      if (e.name === "AbortError") {
        return;
      }

      const error =
        e.data !== undefined
          ? e
          : {
              message: `Failed to fetch: ${e.message}`,
              data: "",
            };
      setState({
        data: null,
        error,
        loading: false,
      });

      throw error;
    }
  }, []);

  useEffect(() => {
    if (!deferred) {
      execute();
    }
    return () => refAbortController.current?.abort();
  }, [url, deferred, execute, ...dependencies]);

  return { ...state, execute, cancel };
};
