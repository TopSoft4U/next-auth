import {useRouter} from "next/router";
import {useEffect} from "react";
import useSWR, {SWRResponse} from "swr";

type ExpectedUser<T> = T & {
  id: number
};

type SwrType<T> = SWRResponse<ExpectedUser<T> | null, any>;

type UseUserProps<T> = {
  apiUrl: string;
  loginUrl: string;

  redirectQueryParam?: string;

  redirectIf?: "GUEST" | "USER" | false;
  redirectTo?: string;
};

type UseUserReturn<T> = {
  user?: SwrType<T>["data"];
  isLoggedIn: boolean;
  setUser: SwrType<T>["mutate"];
};

export const useUser = <T>(
  {
    apiUrl, loginUrl,
    redirectQueryParam = "redirect",
    redirectIf = "GUEST", redirectTo = ""
  }: UseUserProps<T>): UseUserReturn<T> => {
  const {data: user, mutate: setUser} = useSWR<ExpectedUser<T>>(apiUrl);
  const {asPath, query, push, isReady} = useRouter();

  const isLoading = user === undefined;
  const isLoggedIn = !!user?.id;

  useEffect(() => {
    if (!isReady || !redirectIf || isLoading)
      return;

    if (!isLoggedIn && redirectIf === "GUEST") {
      push({
        pathname: loginUrl,
        query: {
          [redirectQueryParam]: asPath
        }
      });
      return;
    }

    if (redirectIf === "USER" && isLoggedIn) {
      push(query?.redirect?.toString() || redirectTo || "/").then();
      return;
    }
  }, [user, redirectTo, isLoggedIn, query?.redirect, asPath, push, redirectIf, isReady, isLoading, loginUrl, redirectQueryParam]);

  return {user, isLoggedIn, setUser};
};
