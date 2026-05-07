import { useParams, useNavigate } from 'react-router-dom'
import { useDataStore } from '@/store'
import TicketDetail from '@/components/tickets/TicketDetail'
import { ArrowLeft } from 'lucide-react'

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const tickets = useDataStore((s) => s.tickets)
  const navigate = useNavigate()
  const ticket = tickets.find((t) => t.id === id)

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
        <p className="text-sm">Ticket <span className="font-mono font-semibold">{id}</span> not found.</p>
        <button onClick={() => navigate('/tickets')} className="flex items-center gap-1.5 text-blue-600 text-sm hover:underline">
          <ArrowLeft size={14} /> Back to tickets
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <TicketDetail ticket={ticket} />
    </div>
  )
}
