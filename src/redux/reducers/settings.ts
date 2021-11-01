import { actionTypes } from '~/redux/constants'

const settings = (state = {}, action) => {

  switch (action.type) {
    case actionTypes.SETTINGS_CENSOR_NSFW_TEXT:
      return {
        ...state,
        censorNSFWText: action.payload
      }
    case actionTypes.SETTINGS_SET_DEFAULT_HOMEPAGE_TAB:
      return {
        ...state,
        defaultHomepageTab: action.payload
      }
    case actionTypes.SETTINGS_SET_HIDE_PLAYBACK_SPEED_BUTTON:
      return {
        ...state,
        playbackSpeedButtonHide: action.payload
      }
    case actionTypes.SETTINGS_SET_UI_THEME:
      return {
        ...state,
        uiTheme: action.payload
      } 
    default:
      return state
  }
}

export default settings
