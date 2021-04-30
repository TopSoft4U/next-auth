import {useRouter} from "next/router";
import {useCallback, useEffect, useMemo} from "react";
import useSWR from "swr";
import {Fetcher} from "swr/dist/types";

export type UseUserProps<Data, Error = any> = {
  loginUrl: string;
  isLoggedIn: (user?: Data) => boolean;

  swrKey?: string,
  swrFetcher?: Fetcher<Data>,

  redirectQueryParam?: string;

  redirectIf?: "GUEST" | "USER" | "NEVER";
  redirectTo?: string;
};

export const useUser = <Data>(
  {
    swrKey = "auth", swrFetcher,
    isLoggedIn,
    loginUrl,
    redirectQueryParam = "redirect",
    redirectIf = "NEVER", redirectTo
  }: UseUserProps<Data>) => {
  const {data: user, mutate: setUser} = useSWR(swrKey, swrFetcher);
  const {asPath, query, push, isReady} = useRouter();

  const isLoading = useMemo(() => user === undefined, [user]);
  const isLoggedInMemo = useMemo(() => isLoggedIn(user), [isLoggedIn, user]);

  // region Redirects
  const redirectNeeded: boolean = useMemo(() => {
    // Not ready yet
    if (!isReady || isLoading)
      return false;

    // Redirect not needed
    return redirectIf !== "NEVER";
  }, [isLoading, isReady, redirectIf]);

  const redirectGuest = useCallback(() => {
    if (isLoggedInMemo || redirectIf !== "GUEST")
      return;

    push({
      pathname: loginUrl,
      query: {
        [redirectQueryParam]: asPath
      }
    }).then();
  }, [asPath, isLoggedInMemo, loginUrl, push, redirectIf, redirectQueryParam]);

  const redirectUser = useCallback(() => {
    if (!isLoggedInMemo || redirectIf !== "USER")
      return;

    push(query?.[redirectQueryParam]?.toString() || redirectTo || "/").then();
  }, [isLoggedInMemo, push, query, redirectIf, redirectQueryParam, redirectTo]);

  useEffect(() => {
    if (!redirectNeeded)
      return;

    redirectGuest();
    redirectUser();
  }, [redirectGuest, redirectNeeded, redirectUser]);
  // endregion

  return {user, isLoggedIn: isLoggedInMemo, setUser};
};
