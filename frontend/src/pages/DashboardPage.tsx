import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard.api'

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => dashboardApi.getSummary(),
  })

  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  const summary = data?.data

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl font-bold text-blue-600">
                  {summary?.totalTransactions || 0}
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Transactions
                  </dt>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl font-bold text-green-600">
                  {summary?.activeTransactions || 0}
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Transactions
                  </dt>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl font-bold text-purple-600">
                  {summary?.completedTransactions || 0}
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completed
                  </dt>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl font-bold text-red-600">
                  {summary?.overdueConditions || 0}
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Overdue Conditions
                  </dt>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl font-bold text-yellow-600">
                  {summary?.dueSoonConditions || 0}
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Due Soon (7 days)
                  </dt>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works section */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-6 py-5">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            How it works
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-medium mr-3">
                1
              </span>
              <p>
                <strong>Create Clients:</strong> Add your clients with their contact information, address, and multiple phone numbers (cell, home, work).
              </p>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-medium mr-3">
                2
              </span>
              <p>
                <strong>Start Transactions:</strong> Create real estate transactions (purchase or sale) and associate them with your clients. Track sale prices, offer dates, and status.
              </p>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-medium mr-3">
                3
              </span>
              <p>
                <strong>Manage Conditions:</strong> Add conditions to transactions with types (inspection, financing, legal, etc.), priorities (low, medium, high), and due dates to track requirements.
              </p>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-medium mr-3">
                4
              </span>
              <p>
                <strong>Track Progress:</strong> Monitor overdue and upcoming conditions on your dashboard. Mark conditions as completed as you fulfill requirements.
              </p>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-medium mr-3">
                5
              </span>
              <p>
                <strong>Add Notes:</strong> Document important information, communications, and updates throughout the transaction lifecycle.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
