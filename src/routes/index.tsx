import { createFileRoute, redirect } from '@tanstack/react-router'
import { FLAGS } from '../lib/flags'

export const Route = createFileRoute('/')({
  beforeLoad: () => { throw redirect({ to: FLAGS.worldMap ? '/map' : '/flights' }) },
})
