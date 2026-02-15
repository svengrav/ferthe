import Page from '@app/shared/components/page/Page'
import { Theme, useTheme } from '@app/shared/theme'
import { StyleSheet, View } from 'react-native'
import { useSession } from '../stores/accountStore'
import AccountLogin from './AccountLogin'

interface AuthenticationWrapperProps {
  children?: React.ReactNode
}

/**
 * AuthenticationWrapper manages the app's authentication state.
 * Unlike a traditional auth guard, this wrapper allows users to access 
 * the app without authentication while tracking their session state.
 */
function AccountAuthWrapper({ children }: AuthenticationWrapperProps) {
  const accountSession = useSession()
  const { styles } = useTheme(createStyles)

  if (!accountSession) {
    return (
      <Page style={styles.page}>
        <View style={styles.loginContainer}>
          <AccountLogin />
        </View>
      </Page>
    )
  }

  return children
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    page: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    loginContainer: {
      marginTop: 20,
      maxWidth: 300,
      alignSelf: 'center',
    },
  })

export default AccountAuthWrapper
