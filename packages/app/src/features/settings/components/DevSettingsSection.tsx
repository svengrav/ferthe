import { FormPicker } from '@app/shared/components'
import Text from '@app/shared/components/text/Text'
import { View } from 'react-native'
import settingsStore from '../stores/settingsStore'

const DEV_ENDPOINTS = [
  { label: 'Localhost (7000)', value: 'http://localhost:7000/api/v1' },
  { label: 'Foxhole (Production)', value: 'https://foxhole.ferthe.de/api/v1' },
]

function DevSettingsSection() {
  const current = settingsStore(state => state.settings.devApiEndpoint ?? 'http://localhost:7000/api/v1')

  return (
    <View style={{ marginTop: 24 }}>
      <Text variant='label'>Development</Text>
      <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant='body'>API Endpoint</Text>
        <FormPicker
          variant='secondary'
          name="devApiEndpoint"
          options={DEV_ENDPOINTS}
        />
      </View>
      <Text variant='caption' style={{ marginTop: 4, opacity: 0.5 }}>Current: {current} — restart required</Text>
    </View>
  )
}

export default DevSettingsSection
