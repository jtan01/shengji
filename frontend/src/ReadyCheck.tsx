import * as React from "react";
import { WebsocketContext } from "./WebsocketProvider";

const ReadyCheck = (): JSX.Element => {
  const { send } = React.useContext(WebsocketContext);

  return (
    <button
      onClick={() =>
        confirm("开始游戏?") && send("ReadyCheck")
      }
    >
      检查所有玩家就绪！
    </button>
  );
};

export default ReadyCheck;
