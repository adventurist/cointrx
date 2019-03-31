import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';

export default function theme () {
  return createMuiTheme({
    palette: {
      type: 'dark',
      secondary: {
        light: '#62efff',
        main: '#00bcd4',
        dark: '#008ba3',
        contrastText: '#fff',
      },
      primary: {
        light: '#ff844c',
        main: '#f4511e',
        // dark: '#b91400',
        dark: '#f4511e',
        contrastText: '#000',
      }
    }
  })
}