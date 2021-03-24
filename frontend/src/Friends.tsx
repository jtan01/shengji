import * as React from "react";
import { IGameMode } from "./types";
import InlineCard from "./InlineCard";

interface IProps {
  gameMode: IGameMode;
  showPlayed: boolean;
}

const Friends = (props: IProps): JSX.Element => {
  const { gameMode } = props;
  if (gameMode !== "Tractor") {
    return (
      <div className="pending-friends">
        {gameMode.FindingFriends.friends.map((friend, idx) => {
          if (friend.player_id !== null) {
            return null;
          }

          if (
            friend.card === null ||
            friend.card === undefined ||
            friend.card.length === 0
          ) {
            return null;
          }
          return (
            <p key={idx}>
              出 {nth(friend.initial_skip + 1)}{" "}
              <InlineCard card={friend.card} /> 牌的是朋友.{" "}
              {props.showPlayed
                ? `出过${
                    friend.initial_skip - friend.skip
                  }张.`
                : ""}
            </p>
          );
        })}
      </div>
    );
  } else {
    return null;
  }
};

function nth(n: number): string {
  const suffix = ["st", "nd", "rd"][
    (((((n < 0 ? -n : n) + 90) % 100) - 10) % 10) - 1
  ];
  return `${n}${suffix !== undefined ? suffix : "th"}`;
}

export default Friends;
