import classnames from "classnames"
import { useOmniAural } from 'omniaural'
import { ButtonCircle } from "../.."
import { faPause, faPlay } from "@fortawesome/free-solid-svg-icons"
import { PlayerControlButton } from "./PlayerControlButton"
import { playerJumpBackward, playerJumpForward, playerJumpMiniBackwards, playerJumpMiniForwards, playerPause, playerPlay } from "~/services/player/player"

type Props = {
  hasMiniJump?: boolean
}

export const PlayerProgressButtons = ({ hasMiniJump }: Props) => {
  const [player] = useOmniAural('player')
  const { paused } = player
  const container = classnames("progress-button-container")
  const playpause = classnames(paused ? "play" : "pause")

  const _handleTrackPrevious = () => {
    console.log('_handleTrackPrevious')
  }

  const _handleTimeJumpBackwards = () => {
    playerJumpBackward()
  }

  const _handleTimeJumpMiniBackwards = () => {
    playerJumpMiniBackwards()
  }

  const _handleTogglePlay = () => {
    paused ? playerPlay() : playerPause()
  }

  const _handleTimeJumpMiniForwards = () => {
    playerJumpMiniForwards()
  }

  const _handleTimeJumpForwards = () => {
    playerJumpForward()
  }

  const _handleTrackNext = () => {
    console.log('_handleTrackNext')
  }

  return (
    <div className={container}>
      {
        !hasMiniJump && (
          <PlayerControlButton
            direction="backwards"
            onClick={_handleTrackPrevious}
            size="medium"
            type="skip" />
        )
      }
      <PlayerControlButton
        direction="backwards"
        onClick={_handleTimeJumpBackwards}
        size="medium"
        type="jump" />
      {
        hasMiniJump && (
          <PlayerControlButton
            direction="backwards"
            onClick={_handleTimeJumpMiniBackwards}
            size="medium"
            type="mini-jump" />
        )
      }
      <ButtonCircle
        className={playpause}
        faIcon={paused ? faPlay : faPause}
        onClick={_handleTogglePlay}
        size={"medium"} />
      {
        hasMiniJump && (
          <PlayerControlButton
            direction="forwards"
            onClick={_handleTimeJumpMiniForwards}
            size="medium"
            type="mini-jump" />
        )
      }
      <PlayerControlButton
        direction="forwards"
        onClick={_handleTimeJumpForwards}
        size="medium"
        type="jump" />
      {
        !hasMiniJump && (
          <PlayerControlButton
            direction="forwards"
            onClick={_handleTrackNext}
            size="medium"
            type="skip" />
        )
      }
    </div>
  )
}
