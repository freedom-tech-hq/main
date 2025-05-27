import { AuthScreen } from '../../flows/auth/components/screens/AuthScreen.tsx';

export interface DemoRouterProps {
  relativePath: string[];
}

export let DemoRouter = (_props: DemoRouterProps) => <></>;
DEV: DemoRouter = ({ relativePath }: DemoRouterProps) => {
  if (relativePath[0] === 'auth-screen') {
    return <AuthScreen />;
  }

  return <></>;
};
