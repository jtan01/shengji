import * as React from "react";
import ReactTooltip from "react-tooltip";
import * as ReactModal from "react-modal";
import { IEmojiData } from "emoji-picker-react";
import ReadyCheck from "./ReadyCheck";
import LandlordSelector from "./LandlordSelector";
import NumDecksSelector from "./NumDecksSelector";
import KittySizeSelector from "./KittySizeSelector";
import RankSelector from "./RankSelector";
import Kicker from "./Kicker";
import ArrayUtils from "./util/array";
import { RandomizePlayersButton } from "./RandomizePlayersButton";
import {
  IInitializePhase,
  IPlayer,
  IPropagatedState,
  IDeck,
  ITractorRequirements,
} from "./types";
import { WebsocketContext } from "./WebsocketProvider";

import Header from "./Header";
import Players from "./Players";
import { GameScoringSettings } from "./ScoringSettings";

const Picker = React.lazy(async () => await import("emoji-picker-react"));

interface IDifficultyProps {
  state: IInitializePhase;
  setFriendSelectionPolicy: (v: React.ChangeEvent<HTMLSelectElement>) => void;
  setMultipleJoinPolicy: (v: React.ChangeEvent<HTMLSelectElement>) => void;
  setAdvancementPolicy: (v: React.ChangeEvent<HTMLSelectElement>) => void;
  setHideLandlordsPoints: (v: React.ChangeEvent<HTMLSelectElement>) => void;
  setHidePlayedCards: (v: React.ChangeEvent<HTMLSelectElement>) => void;
  setKittyPenalty: (v: React.ChangeEvent<HTMLSelectElement>) => void;
  setThrowPenalty: (v: React.ChangeEvent<HTMLSelectElement>) => void;
  setPlayTakebackPolicy: (v: React.ChangeEvent<HTMLSelectElement>) => void;
  setBidTakebackPolicy: (v: React.ChangeEvent<HTMLSelectElement>) => void;
}

const contentStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
};

const DifficultySettings = (props: IDifficultyProps): JSX.Element => {
  const [modalOpen, setModalOpen] = React.useState<boolean>(false);
  const s = (
    <>
      <div>
        <label>
          找朋友限制:{" "}
          <select
            value={props.state.propagated.friend_selection_policy}
            onChange={props.setFriendSelectionPolicy}
          >
            <option value="Unrestricted">不可以是王</option>
            <option value="TrumpsIncluded">任何牌，包括大小王</option>
            <option value="HighestCardNotAllowed">
              不可以是王或最大的牌
            </option>
            <option value="PointCardNotAllowed">
              不可以是王, 不可以是分 (但是打A的时候可以是K)
            </option>
          </select>
        </label>
      </div>
      <div>
        <label>
          是否必打的级:{" "}
          <select
            value={props.state.propagated.multiple_join_policy}
            onChange={props.setMultipleJoinPolicy}
          >
            <option value="Unrestricted">
              Players can join the defending team multiple times.
            </option>
            <option value="NoDoubleJoin">
              Each player can only join the defending team once.
            </option>
          </select>
        </label>
      </div>
      <div>
        <label>
          升级策略:{" "}
          <select
            value={props.state.propagated.advancement_policy}
            onChange={props.setAdvancementPolicy}
          >
            <option value="Unrestricted">A必打</option>
            <option value="FullyUnrestricted">无限制</option>
            <option value="DefendPoints">
              分 (5, 10, K) 和 A 必打
            </option>
          </select>
        </label>
      </div>
      <div>
        <label>
          得分显示:{" "}
          <select
            value={
              props.state.propagated.hide_landlord_points ? "hide" : "show"
            }
            onChange={props.setHideLandlordsPoints}
          >
            <option value="show">显示</option>
            <option value="hide">不显示</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          是否展示打过的牌 (在聊天窗口):{" "}
          <select
            value={props.state.propagated.hide_played_cards ? "hide" : "show"}
            onChange={props.setHidePlayedCards}
          >
            <option value="show">显示</option>
            <option value="hide">不显示</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          抠底得分翻倍:{" "}
          <select
            value={props.state.propagated.kitty_penalty}
            onChange={props.setKittyPenalty}
          >
            <option value="Times">抠底张数乘2</option>
            <option value="Power">
              抠底张数的平方
            </option>
          </select>
        </label>
      </div>
      <div>
        <label>
          甩牌罚分规则:{" "}
          <select
            value={props.state.propagated.throw_penalty}
            onChange={props.setThrowPenalty}
          >
            <option value="TenPointsPerAttempt">
              罚10分
            </option>
            <option value="None">不罚分</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          可否悔牌:{" "}
          <select
            value={props.state.propagated.play_takeback_policy}
            onChange={props.setPlayTakebackPolicy}
          >
            <option value="NoPlayTakeback">不可</option>
            <option value="AllowPlayTakeback">可以</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          可否悔亮主牌:{" "}
          <select
            value={props.state.propagated.bid_takeback_policy}
            onChange={props.setBidTakebackPolicy}
          >
            <option value="NoBidTakeback">不可</option>
            <option value="AllowBidTakeback">可以</option>
          </select>
        </label>
      </div>
    </>
  );

  return (
    <div>
      <label>
        难度设置:{" "}
        <button
          className="normal"
          onClick={(evt) => {
            evt.preventDefault();
            setModalOpen(true);
          }}
        >
          Open
        </button>
        <ReactModal
          isOpen={modalOpen}
          onRequestClose={() => setModalOpen(false)}
          shouldCloseOnOverlayClick
          shouldCloseOnEsc
          style={{ content: contentStyle }}
        >
          {s}
        </ReactModal>
      </label>
    </div>
  );
};

interface IDeckSettings {
  decks: IDeck[];
  setSpecialDecks: (specialDecks: IDeck[]) => void;
}

const DeckSettings = (props: IDeckSettings): JSX.Element => {
  const [modalOpen, setModalOpen] = React.useState<boolean>(false);
  const isNotDefault = (d: IDeck): boolean =>
    !(d.min === "2" && !d.exclude_big_joker && !d.exclude_small_joker);
  const onChange = (decks: IDeck[]): void => {
    // exclude the decks that are the same as default
    const filtered = decks.filter((d) => isNotDefault(d));
    props.setSpecialDecks(filtered);
  };

  const setDeckAtIndex = (deck: IDeck, index: number): void => {
    const newDecks = [...props.decks];
    newDecks[index] = deck;
    onChange(newDecks);
  };
  const numbers = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A",
  ];

  const s = (
    <>
      {props.decks.map((d, i) => (
        <div
          key={i}
          style={{
            display: "inline-block",
            border: "1px solid #000",
            padding: "5px",
            margin: "5px",
          }}
        >
          Deck {i + 1}
          {isNotDefault(d) ? " (modified)" : " (standard)"}
          <form>
            <label style={{ display: "block" }}>
              Include HJ (大王){" "}
              <input
                type="checkbox"
                checked={!d.exclude_big_joker}
                onChange={(evt) =>
                  setDeckAtIndex(
                    { ...d, exclude_big_joker: !evt.target.checked },
                    i
                  )
                }
              />
            </label>
            <label style={{ display: "block" }}>
              Include LJ (小王){" "}
              <input
                type="checkbox"
                checked={!d.exclude_small_joker}
                onChange={(evt) =>
                  setDeckAtIndex(
                    { ...d, exclude_small_joker: !evt.target.checked },
                    i
                  )
                }
              />
            </label>
            <label>
              最小叫牌:{" "}
              <select
                value={d.min}
                onChange={(evt) =>
                  setDeckAtIndex({ ...d, min: evt.target.value }, i)
                }
              >
                {numbers.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </form>
        </div>
      ))}
      <pre>{JSON.stringify(props.decks, null, 2)}</pre>
    </>
  );

  return (
    <div>
      <label>
        其它副牌设置:{" "}
        <button
          className="normal"
          onClick={(evt) => {
            evt.preventDefault();
            setModalOpen(true);
          }}
        >
          Open
        </button>
        <ReactModal
          isOpen={modalOpen}
          onRequestClose={() => setModalOpen(false)}
          shouldCloseOnOverlayClick
          shouldCloseOnEsc
          style={{ content: contentStyle }}
        >
          {s}
        </ReactModal>
      </label>
    </div>
  );
};

interface ITractorRequirementsProps {
  tractorRequirements: ITractorRequirements;
  numDecks: number;
  onChange: (requirements: ITractorRequirements) => void;
}

const TractorRequirements = (props: ITractorRequirementsProps): JSX.Element => {
  return (
    <div>
      <label>Tractor requirements: </label>
      <input
        type="number"
        style={{ width: "3em" }}
        onChange={(v) =>
          props.onChange({
            ...props.tractorRequirements,
            min_count: v.target.valueAsNumber,
          })
        }
        value={props.tractorRequirements.min_count}
        min="2"
        max={props.numDecks}
      />
      <label> cards wide by </label>
      <input
        type="number"
        style={{ width: "3em" }}
        onChange={(v) =>
          props.onChange({
            ...props.tractorRequirements,
            min_length: v.target.valueAsNumber,
          })
        }
        value={props.tractorRequirements.min_length}
        min="2"
        max="12"
      />
      <label> tuples long</label>
    </div>
  );
};

interface IScoringSettings {
  state: IInitializePhase;
  decks: IDeck[];
}
const ScoringSettings = (props: IScoringSettings): JSX.Element => {
  const [modalOpen, setModalOpen] = React.useState<boolean>(false);
  return (
    <div>
      <label>
        升级评分设置:{" "}
        <button
          className="normal"
          onClick={(evt) => {
            evt.preventDefault();
            setModalOpen(true);
          }}
        >
          Open
        </button>
        <ReactModal
          isOpen={modalOpen}
          onRequestClose={() => setModalOpen(false)}
          shouldCloseOnOverlayClick
          shouldCloseOnEsc
          style={{ content: contentStyle }}
        >
          <GameScoringSettings
            params={props.state.propagated.game_scoring_parameters}
            decks={props.decks}
          />
        </ReactModal>
      </label>
    </div>
  );
};

interface IUncommonSettings {
  state: IInitializePhase;
  numDecksEffective: number;
  setBidPolicy: (v: React.ChangeEvent<HTMLSelectElement>) => void;
  setBidReinforcementPolicy: (v: React.ChangeEvent<HTMLSelectElement>) => void;
  setJokerBidPolicy: (v: React.ChangeEvent<HTMLSelectElement>) => void;
  setShouldRevealKittyAtEndOfGame: (
    v: React.ChangeEvent<HTMLSelectElement>
  ) => void;
  setFirstLandlordSelectionPolicy: (
    v: React.ChangeEvent<HTMLSelectElement>
  ) => void;
  setGameStartPolicy: (v: React.ChangeEvent<HTMLSelectElement>) => void;
  setGameShadowingPolicy: (v: React.ChangeEvent<HTMLSelectElement>) => void;
  setKittyBidPolicy: (v: React.ChangeEvent<HTMLSelectElement>) => void;
  setHideThrowHaltingPlayer: (v: React.ChangeEvent<HTMLSelectElement>) => void;
  setTractorRequirements: (v: ITractorRequirements) => void;
}

const UncommonSettings = (props: IUncommonSettings): JSX.Element => {
  const [modalOpen, setModalOpen] = React.useState<boolean>(false);
  const s = (
    <>
      <div>
        <label>
          旁观策略:{" "}
          <select
            value={props.state.propagated.game_shadowing_policy}
            onChange={props.setGameShadowingPolicy}
          >
            <option value="AllowMultipleSessions">
              允许以同名玩家旁观
            </option>
            <option value="SingleSessionOnly">
              不允许旁观
            </option>
          </select>
        </label>
      </div>
      <div>
        <label>
          开始牌局按钮:{" "}
          <select
            value={props.state.propagated.game_start_policy}
            onChange={props.setGameStartPolicy}
          >
            <option value="AllowAnyPlayer">
              任何玩家均可
            </option>
            <option value="AllowLandlordOnly">
              仅限庄家
            </option>
          </select>
        </label>
      </div>
      <div>
        <label>
        亮主牌定庄规则（刚开始时）:{" "}
          <select
            value={props.state.propagated.first_landlord_selection_policy}
            onChange={props.setFirstLandlordSelectionPolicy}
          >
            <option value="ByWinningBid">
              庄家定庄
            </option>
            <option value="ByFirstBid">
              先亮牌定庄
            </option>
          </select>
        </label>
      </div>
      <div>
        <label>
          翻底亮主牌规则:{" "}
          <select
            value={props.state.propagated.kitty_bid_policy}
            onChange={props.setKittyBidPolicy}
          >
            <option value="FirstCard">第一张</option>
            <option value="FirstCardOfLevelOrHighest">
              第一张常主牌（最大的牌）
            </option>
          </select>
        </label>
      </div>
      <div>
        <label>
          反主牌规则:{" "}
          <select
            value={props.state.propagated.bid_policy}
            onChange={props.setBidPolicy}
          >
            <option value="JokerOrHigherSuit">
              Joker or higher suit bids to outbid non-joker bids with the same
              number of cards
            </option>
            <option value="JokerOrGreaterLength">
              同数目王牌可反无将
            </option>
            <option value="GreaterLength">
              必须多数才可反
            </option>
          </select>
        </label>
      </div>
      <div>
        <label>
          叫庄加强策略:{" "}
          <select
            value={props.state.propagated.bid_reinforcement_policy}
            onChange={props.setBidReinforcementPolicy}
          >
            <option value="ReinforceWhileWinning">
              当前叫庄者可加强
            </option>
            <option value="ReinforceWhileEquivalent">
              参与叫庄者可加强
            </option>
            <option value="OverturnOrReinforceWhileWinning">
              当前叫庄者可以改叫
            </option>
          </select>
        </label>
      </div>
      <div>
        <label>
          无将叫牌策略:{" "}
          <select
            value={props.state.propagated.joker_bid_policy}
            onChange={props.setJokerBidPolicy}
          >
            <option value="BothTwoOrMore">
              至少两个王（大小均可）
            </option>
            <option value="BothNumDecks">
              需要全部大王或小王
            </option>
            <option value="LJNumDecksHJNumDecksLessOne">
              至少两个小王或者一个大王
            </option>
          </select>
        </label>
      </div>
      <TractorRequirements
        tractorRequirements={props.state.propagated.tractor_requirements}
        numDecks={props.numDecksEffective}
        onChange={(req) => props.setTractorRequirements(req)}
      />
      <div>
        <label>
          游戏结束亮底牌？:{" "}
          <select
            value={
              props.state.propagated.should_reveal_kitty_at_end_of_game
                ? "show"
                : "hide"
            }
            onChange={props.setShouldRevealKittyAtEndOfGame}
          >
            <option value="hide">
              不在聊天窗口亮底牌
            </option>
            <option value="show">
              在聊天窗口亮底牌
            </option>
          </select>
        </label>
      </div>
      <div>
        <label>
          提示玩家谁比甩牌大:{" "}
          <select
            value={
              props.state.propagated.hide_throw_halting_player ? "hide" : "show"
            }
            onChange={props.setHideThrowHaltingPlayer}
          >
            <option value="hide">
              不提示
            </option>
            <option value="show">
              提示
            </option>
          </select>
        </label>
      </div>
    </>
  );
  return (
    <div>
      <label>
        更多设置:{" "}
        <button
          className="normal"
          onClick={(evt) => {
            evt.preventDefault();
            setModalOpen(true);
          }}
        >
          Open
        </button>
        <ReactModal
          isOpen={modalOpen}
          onRequestClose={() => setModalOpen(false)}
          shouldCloseOnOverlayClick
          shouldCloseOnEsc
          style={{ content: contentStyle }}
        >
          {s}
        </ReactModal>
      </label>
    </div>
  );
};

interface IProps {
  state: IInitializePhase;
  name: string;
}

const Initialize = (props: IProps): JSX.Element => {
  const { send } = React.useContext(WebsocketContext);
  const [showPicker, setShowPicker] = React.useState<boolean>(false);
  const setGameMode = (evt: React.ChangeEvent<HTMLSelectElement>): void => {
    evt.preventDefault();
    if (evt.target.value === "Tractor") {
      send({ Action: { SetGameMode: "Tractor" } });
    } else {
      send({
        Action: {
          SetGameMode: {
            FindingFriends: {
              num_friends: null,
            },
          },
        },
      });
    }
  };

  const setNumFriends = (evt: React.ChangeEvent<HTMLSelectElement>): void => {
    evt.preventDefault();
    if (evt.target.value === "") {
      send({
        Action: {
          SetGameMode: {
            FindingFriends: {
              num_friends: null,
            },
          },
        },
      });
    } else {
      const num = parseInt(evt.target.value, 10);
      send({
        Action: {
          SetGameMode: {
            FindingFriends: {
              num_friends: num,
            },
          },
        },
      });
    }
  };

  const onSelectString =
    (action: string): ((evt: React.ChangeEvent<HTMLSelectElement>) => void) =>
    (evt: React.ChangeEvent<HTMLSelectElement>): void => {
      evt.preventDefault();
      if (evt.target.value !== "") {
        send({ Action: { [action]: evt.target.value } });
      }
    };

  const onSelectStringDefault =
    (
      action: string,
      defaultValue: null | string
    ): ((evt: React.ChangeEvent<HTMLSelectElement>) => void) =>
    (evt: React.ChangeEvent<HTMLSelectElement>): void => {
      evt.preventDefault();
      if (evt.target.value !== "") {
        send({ Action: { [action]: evt.target.value } });
      } else {
        send({ Action: { [action]: defaultValue } });
      }
    };

  const setFriendSelectionPolicy = onSelectString("SetFriendSelectionPolicy");
  const setMultipleJoinPolicy = onSelectString("SetMultipleJoinPolicy");
  const setFirstLandlordSelectionPolicy = onSelectString(
    "SetFirstLandlordSelectionPolicy"
  );
  const setBidPolicy = onSelectString("SetBidPolicy");
  const setBidReinforcementPolicy = onSelectString("SetBidReinforcementPolicy");
  const setJokerBidPolicy = onSelectString("SetJokerBidPolicy");
  const setKittyTheftPolicy = onSelectString("SetKittyTheftPolicy");
  const setKittyBidPolicy = onSelectString("SetKittyBidPolicy");
  const setTrickDrawPolicy = onSelectString("SetTrickDrawPolicy");
  const setThrowEvaluationPolicy = onSelectString("SetThrowEvaluationPolicy");
  const setPlayTakebackPolicy = onSelectString("SetPlayTakebackPolicy");
  const setGameShadowingPolicy = onSelectString("SetGameShadowingPolicy");
  const setGameStartPolicy = onSelectString("SetGameStartPolicy");
  const setBidTakebackPolicy = onSelectString("SetBidTakebackPolicy");

  const setShouldRevealKittyAtEndOfGame = (
    evt: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    evt.preventDefault();
    if (evt.target.value !== "") {
      send({
        Action: {
          SetShouldRevealKittyAtEndOfGame: evt.target.value === "show",
        },
      });
    }
  };
  const setHideThrowHaltingPlayer = (
    evt: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    evt.preventDefault();
    if (evt.target.value !== "") {
      send({
        Action: {
          SetHideThrowHaltingPlayer: evt.target.value === "hide",
        },
      });
    }
  };

  const setKittyPenalty = onSelectStringDefault("SetKittyPenalty", null);
  const setAdvancementPolicy = onSelectStringDefault(
    "SetAdvancementPolicy",
    "Unrestricted"
  );
  const setThrowPenalty = onSelectStringDefault("SetThrowPenalty", null);

  const setHideLandlordsPoints = (
    evt: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    evt.preventDefault();
    send({ Action: { SetHideLandlordsPoints: evt.target.value === "hide" } });
  };

  const setHidePlayedCards = (
    evt: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    evt.preventDefault();
    send({ Action: { SetHidePlayedCards: evt.target.value === "hide" } });
  };

  const startGame = (evt: React.SyntheticEvent): void => {
    evt.preventDefault();
    send({ Action: "StartGame" });
  };

  const setEmoji = (
    evt: React.MouseEvent,
    emojiObject: IEmojiData | null
  ): void => {
    evt.preventDefault();
    send({
      Action: {
        SetLandlordEmoji:
          emojiObject !== undefined && emojiObject !== null
            ? emojiObject.emoji
            : null,
      },
    });
  };

  const modeAsString =
    props.state.propagated.game_mode === "Tractor"
      ? "Tractor"
      : "FindingFriends";
  const numFriends =
    props.state.propagated.game_mode === "Tractor" ||
    props.state.propagated.game_mode.FindingFriends.num_friends === null
      ? ""
      : props.state.propagated.game_mode.FindingFriends.num_friends;
  const decksEffective =
    props.state.propagated.num_decks !== undefined &&
    props.state.propagated.num_decks !== null &&
    props.state.propagated.num_decks > 0
      ? props.state.propagated.num_decks
      : Math.max(Math.floor(props.state.propagated.players.length / 2), 1);
  const decks = [...props.state.propagated.special_decks];
  while (decks.length < decksEffective) {
    decks.push({
      exclude_big_joker: false,
      exclude_small_joker: false,
      min: "2",
    });
  }
  decks.length = decksEffective;

  let currentPlayer = props.state.propagated.players.find(
    (p: IPlayer) => p.name === props.name
  );
  if (currentPlayer === undefined) {
    currentPlayer = props.state.propagated.observers.find(
      (p) => p.name === props.name
    );
  }
  if (currentPlayer === undefined) {
    currentPlayer = {
      id: -1,
      name: props.name,
      level: "",
      metalevel: 0,
    };
  }

  const landlordIndex = props.state.propagated.players.findIndex(
    (p) => p.id === props.state.propagated.landlord
  );
  const saveGameSettings = (evt: React.SyntheticEvent): void => {
    evt.preventDefault();
    localStorage.setItem(
      "gameSettingsInLocalStorage",
      JSON.stringify(props.state.propagated)
    );
  };

  const setGameSettings = (gameSettings: IPropagatedState): void => {
    if (gameSettings !== null) {
      let kittySizeSet = false;
      let kittySize = null;
      for (const [key, value] of Object.entries(gameSettings)) {
        switch (key) {
          case "game_mode":
            send({
              Action: {
                SetGameMode: value,
              },
            });
            break;
          case "num_decks":
            send({
              Action: {
                SetNumDecks: value,
              },
            });
            if (kittySizeSet) {
              // reset the size again, as setting deck num resets kitty_size to default
              send({
                Action: {
                  SetKittySize: kittySize,
                },
              });
            }
            break;
          case "special_decks":
            send({
              Action: {
                SetSpecialDecks: value,
              },
            });
            break;
          case "kitty_size":
            send({
              Action: {
                SetKittySize: value,
              },
            });
            kittySizeSet = true;
            kittySize = value;
            break;
          case "friend_selection_policy":
            send({
              Action: {
                SetFriendSelectionPolicy: value,
              },
            });
            break;
          case "multiple_join_policy":
            send({
              Action: {
                SetMultipleJoinPolicy: value,
              },
            });
            break;
          case "first_landlord_selection_policy":
            send({
              Action: {
                SetFirstLandlordSelectionPolicy: value,
              },
            });
            break;
          case "hide_landlord_points":
            send({
              Action: {
                SetHideLandlordsPoints: value,
              },
            });
            break;
          case "hide_played_cards":
            send({ Action: { SetHidePlayedCards: value } });
            break;
          case "advancement_policy":
            send({
              Action: {
                SetAdvancementPolicy: value,
              },
            });
            break;
          case "kitty_bid_policy":
            send({
              Action: {
                SetKittyBidPolicy: value,
              },
            });
            break;
          case "kitty_penalty":
            send({
              Action: {
                SetKittyPenalty: value,
              },
            });
            break;
          case "kitty_theft_policy":
            send({
              Action: {
                SetKittyTheftPolicy: value,
              },
            });
            break;
          case "throw_penalty":
            send({
              Action: {
                SetThrowPenalty: value,
              },
            });
            break;
          case "trick_draw_policy":
            send({
              Action: {
                SetTrickDrawPolicy: value,
              },
            });
            break;
          case "throw_evaluation_policy":
            send({
              Action: {
                SetThrowEvaluationPolicy: value,
              },
            });
            break;
          case "landlord_emoji":
            send({
              Action: {
                SetLandlordEmoji: value,
              },
            });
            break;
          case "bid_policy":
            send({
              Action: {
                SetBidPolicy: value,
              },
            });
            break;
          case "bid_reinforcement_policy":
            send({
              Action: {
                SetBidReinforcementPolicy: value,
              },
            });
            break;
          case "joker_bid_policy":
            send({
              Action: {
                SetJokerBidPolicy: value,
              },
            });
            break;
          case "should_reveal_kitty_at_end_of_game":
            send({
              Action: {
                SetShouldRevealKittyAtEndOfGame: value,
              },
            });
            break;
          case "hide_throw_halting_player":
            send({ Action: { SetHideThrowHaltingPlayer: value } });
            break;
          case "game_scoring_parameters":
            send({
              Action: {
                SetGameScoringParameters: value,
              },
            });
            break;
          case "play_takeback_policy":
            send({
              Action: {
                SetPlayTakebackPolicy: value,
              },
            });
            break;
          case "bid_takeback_policy":
            send({
              Action: {
                SetBidTakebackPolicy: value,
              },
            });
            break;
          case "game_shadowing_policy":
            send({
              Action: {
                SetGameShadowingPolicy: value,
              },
            });
            break;
          case "game_start_policy":
            send({
              Action: {
                SetGameStartPolicy: value,
              },
            });
            break;
          case "tractor_requirements":
            send({
              Action: {
                SetTractorRequirements: value,
              },
            });
            break;
        }
      }
    }
  };

  const loadGameSettings = (evt: React.SyntheticEvent): void => {
    evt.preventDefault();
    const settings = localStorage.getItem("gameSettingsInLocalStorage");
    if (settings !== null) {
      let gameSettings: IPropagatedState;
      try {
        gameSettings = JSON.parse(settings);

        const fetchAsync = async (): Promise<void> => {
          const fetchResult = await fetch("default_settings.json");
          const fetchJSON = await fetchResult.json();
          const combined = { ...fetchJSON, ...gameSettings };
          if (
            combined.bonus_level_policy !== undefined &&
            combined.game_scoring_parameters !== undefined &&
            combined.bonus_level_policy !==
              combined.game_scoring_parameters.bonus_level_policy
          ) {
            combined.game_scoring_parameters.bonus_level_policy =
              combined.bonus_level_policy;
          }
          setGameSettings(combined);
        };

        fetchAsync().catch((e) => {
          console.error(e);
          localStorage.setItem(
            "gameSettingsInLocalStorage",
            JSON.stringify(props.state.propagated)
          );
        });
      } catch (err) {
        localStorage.setItem(
          "gameSettingsInLocalStorage",
          JSON.stringify(props.state.propagated)
        );
      }
    }
  };

  const resetGameSettings = (evt: React.SyntheticEvent): void => {
    evt.preventDefault();

    const fetchAsync = async (): Promise<void> => {
      const fetchResult = await fetch("default_settings.json");
      const fetchJSON = await fetchResult.json();
      setGameSettings(fetchJSON);
    };

    fetchAsync().catch((e) => console.error(e));
  };

  return (
    <div>
      <Header
        gameMode={props.state.propagated.game_mode}
        chatLink={props.state.propagated.chat_link}
      />
      <Players
        players={props.state.propagated.players}
        observers={props.state.propagated.observers}
        landlord={props.state.propagated.landlord}
        next={null}
        movable={true}
        name={props.name}
      />
      <p>
        用此链接邀请朋友:{" "}
        <a href={window.location.href} target="_blank" rel="noreferrer">
          <code>{window.location.href}</code>
        </a>
      </p>
      {props.state.propagated.players.length >= 4 ? (
        <>
          <button
            disabled={
              props.state.propagated.game_start_policy ===
                "AllowLandlordOnly" &&
              landlordIndex !== -1 &&
              props.state.propagated.players[landlordIndex].name !== props.name
            }
            onClick={startGame}
          >
            开始
          </button>
          <ReadyCheck />
        </>
      ) : (
        <h2>等待玩家加入...</h2>
      )}
      <RandomizePlayersButton players={props.state.propagated.players}>
        随机调整玩家座位
      </RandomizePlayersButton>
      <Kicker
        players={props.state.propagated.players}
        onKick={(playerId: number) => send({ Kick: playerId })}
      />
      <div className="game-settings">
        <h3>游戏设置</h3>
        <div>
          <label>
            牌局模式:{" "}
            <select value={modeAsString} onChange={setGameMode}>
              <option value="Tractor">升级 / Tractor</option>
              <option value="FindingFriends">找朋友 / Finding Friends</option>
            </select>
          </label>
        </div>
        <div>
          {props.state.propagated.game_mode !== "Tractor" ? (
            <label>
              朋友数:{" "}
              <select value={numFriends} onChange={setNumFriends}>
                <option value="">default</option>
                {ArrayUtils.range(
                  Math.max(
                    Math.floor(props.state.propagated.players.length / 2) - 1,
                    0
                  ),
                  (idx) => (
                    <option value={idx + 1} key={idx}>
                      {idx + 1}
                    </option>
                  )
                )}
              </select>
            </label>
          ) : null}
        </div>
        <NumDecksSelector
          numPlayers={props.state.propagated.players.length}
          numDecks={props.state.propagated.num_decks}
          onChange={(newNumDecks: number | null) =>
            send({ Action: { SetNumDecks: newNumDecks } })
          }
        />
        <DeckSettings
          decks={decks}
          setSpecialDecks={(d) => send({ Action: { SetSpecialDecks: d } })}
        />
        <KittySizeSelector
          numPlayers={props.state.propagated.players.length}
          decks={decks}
          kittySize={props.state.propagated.kitty_size}
          onChange={(newKittySize: number | null) =>
            send({ Action: { SetKittySize: newKittySize } })
          }
        />
        <div>
          <label>
            是否炒地皮:{" "}
            <select
              value={props.state.propagated.kitty_theft_policy}
              onChange={setKittyTheftPolicy}
            >
              <option value="AllowKittyTheft">允许 (炒地皮)</option>
              <option value="NoKittyTheft">不允许</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            套牌保护规则:{" "}
            <select
              value={props.state.propagated.trick_draw_policy}
              onChange={setTrickDrawPolicy}
            >
              <option value="NoProtections">不保护</option>
              <option value="LongerTuplesProtected">
                保护高阶（三个不必拆分跟对子 等等）
              </option>
              <option value="OnlyDrawTractorOnTractor">
                对等跟牌
              </option>
              <option value="NoFormatBasedDraw">
                无要求 (对子不必跟对子)
              </option>
            </select>
          </label>
        </div>
        <div>
          <label>
            甩牌比较策略:{" "}
            <select
              value={props.state.propagated.throw_evaluation_policy}
              onChange={setThrowEvaluationPolicy}
            >
              <option value="All">
                跟牌所有套牌都大
              </option>
              <option value="Highest">
                跟牌比最高阶牌大即可
              </option>
              <option value="TrickUnitLength">
                跟牌比最高阶套牌大
              </option>
            </select>
          </label>
        </div>
        <ScoringSettings state={props.state} decks={decks} />
        <UncommonSettings
          state={props.state}
          numDecksEffective={decksEffective}
          setBidPolicy={setBidPolicy}
          setBidReinforcementPolicy={setBidReinforcementPolicy}
          setJokerBidPolicy={setJokerBidPolicy}
          setShouldRevealKittyAtEndOfGame={setShouldRevealKittyAtEndOfGame}
          setHideThrowHaltingPlayer={setHideThrowHaltingPlayer}
          setFirstLandlordSelectionPolicy={setFirstLandlordSelectionPolicy}
          setGameStartPolicy={setGameStartPolicy}
          setGameShadowingPolicy={setGameShadowingPolicy}
          setKittyBidPolicy={setKittyBidPolicy}
          setTractorRequirements={(requirements) =>
            send({ Action: { SetTractorRequirements: requirements } })
          }
        />
        <DifficultySettings
          state={props.state}
          setFriendSelectionPolicy={setFriendSelectionPolicy}
          setMultipleJoinPolicy={setMultipleJoinPolicy}
          setAdvancementPolicy={setAdvancementPolicy}
          setHideLandlordsPoints={setHideLandlordsPoints}
          setHidePlayedCards={setHidePlayedCards}
          setKittyPenalty={setKittyPenalty}
          setThrowPenalty={setThrowPenalty}
          setPlayTakebackPolicy={setPlayTakebackPolicy}
          setBidTakebackPolicy={setBidTakebackPolicy}
        />
        <h3>游戏持续设置</h3>
        <LandlordSelector
          players={props.state.propagated.players}
          landlordId={props.state.propagated.landlord}
          onChange={(newLandlord: number | null) =>
            send({ Action: { SetLandlord: newLandlord } })
          }
        />
        <RankSelector
          rank={currentPlayer.level}
          onChangeRank={(newRank: string) =>
            send({ Action: { SetRank: newRank } })
          }
        />
        <h3>其它设置</h3>
        <div>
          <label>
            庄家标签:{" "}
            {props.state.propagated.landlord_emoji !== null &&
            props.state.propagated.landlord_emoji !== undefined &&
            props.state.propagated.landlord_emoji !== ""
              ? props.state.propagated.landlord_emoji
              : "当庄"}{" "}
            <button
              className="normal"
              onClick={() => {
                showPicker ? setShowPicker(false) : setShowPicker(true);
              }}
            >
              {showPicker ? "关闭" : "选择"}
            </button>
            <button
              className="normal"
              disabled={props.state.propagated.landlord_emoji == null}
              onClick={() => {
                send({ Action: { SetLandlordEmoji: null } });
              }}
            >
              Default
            </button>
            {showPicker ? (
              <React.Suspense fallback={"..."}>
                <Picker onEmojiClick={setEmoji} />
              </React.Suspense>
            ) : null}
          </label>
        </div>
        <div>
          <label>
            设置管理:
            <button
              className="normal"
              data-tip
              data-for="saveTip"
              onClick={saveGameSettings}
            >
              保存
            </button>
            <ReactTooltip id="saveTip" place="top" effect="solid">
              Save game settings
            </ReactTooltip>
            <button
              className="normal"
              data-tip
              data-for="loadTip"
              onClick={loadGameSettings}
            >
              取回
            </button>
            <ReactTooltip id="loadTip" place="top" effect="solid">
              Load saved game settings
            </ReactTooltip>
            <button
              className="normal"
              data-tip
              data-for="resetTip"
              onClick={resetGameSettings}
            >
              重置
            </button>
            <ReactTooltip id="resetTip" place="top" effect="solid">
              Reset game settings to defaults
            </ReactTooltip>
          </label>
        </div>
      </div>
    </div>
  );
};

export default Initialize;
