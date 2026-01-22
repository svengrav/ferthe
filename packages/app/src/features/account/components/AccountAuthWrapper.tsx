import Page from '@app/shared/components/page/Page'
import useThemeStore from '@app/shared/theme/themeStore'
import React from 'react'
import { View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
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
const AccountAuthWrapper = ({ children }: AuthenticationWrapperProps) => {
  const accountSession = useSession()
  const theme = useThemeStore()

  if (!accountSession) {
    return (
      <Page
        options={[]}
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background
        }}>
        <View>
          <ScrollView>
            <AccountLogin />
          </ScrollView>
        </View>
      </Page>
    )
  }

  // Always show the main app - authentication is optional
  return children
}

export default AccountAuthWrapper
