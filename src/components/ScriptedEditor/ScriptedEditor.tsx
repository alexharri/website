import { useEffect } from "react";

interface Props {
  initialCode: string;
  script: any[];
}

export const ScriptedEditor = (props: Props) => {
  useEffect(() => {
    let unmounted = false;

    function runCommand(item: any) {
      console.log(item);
    }

    const run = async () => {
      for (const item of props.script) {
        if (unmounted) return;

        runCommand(item);

        await new Promise<void>((resolve) => setTimeout(resolve, 500));
      }
    };

    setTimeout(run, 1000);

    return () => {
      unmounted = true;
    };
  }, []);

  return <div>{props.initialCode}</div>;
};
