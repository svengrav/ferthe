import DiscoveryCard from '@app/features/discovery/components/DiscoveryCard'
import { Theme } from '@app/shared'
import { Page, Text } from '@app/shared/components/'
import { StyleSheet } from 'react-native'


export default function DevScreen() {

  return (
    <Page
      options={[
      ]}>
      <Text style={{ backgroundColor: 'red' }}>TEST</Text>
      <DiscoveryCard card={
        {
          discoveryId: 'test-discovery-id',
          spotId: 'test-spot-id',
          description: 'This is a test description',
          image: {
            id: 'test-id',
            url: 'https://stferthecore.blob.core.windows.net/resources/trails/ascheberg-kirmes-trail-8010/cmc35ne37jbzs2db624de78df.png?sp=r&st=2025-06-20T09:38:55Z&se=2030-06-20T17:38:55Z&spr=https&sv=2024-11-04&sr=b&sig=t64nUkTGdqWbk%2FV3v71I8L%2F2JanwK9jOwixNgnp2ObQ%3D',
          },
          title: 'Test Card',
          discoveredAt: new Date(),
        }
      } />
    </Page>
  )
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 4,
      paddingVertical: 8,
      marginBottom: 8,
    },

    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      justifyContent: 'flex-end',
    },

    intro: {
      padding: 16,
      flex: 1,
      alignItems: 'center',
      textAlign: 'center',
      color: theme.colors.primary,
    },

    logo: {
      marginBottom: 10,
    },
    listContent: {
      gap: 16,
      paddingHorizontal: 8, // Optional: Add some horizontal padding if needed
    },
  })


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  face: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  text: {
    fontSize: 24,
    color: 'white',
  },
})