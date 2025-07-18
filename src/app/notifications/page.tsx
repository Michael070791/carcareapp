'use client'

import React, { useState, useEffect } from 'react'
import { Card, List, Typography, Empty, Button, Badge, Space, Tag, Divider, message, Avatar } from 'antd'
import { BellOutlined, CheckOutlined, MessageOutlined, CarOutlined, ToolOutlined, ShoppingOutlined } from '@ant-design/icons'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { DatabaseService } from '@/services/database'
import { NotificationData } from '@/types'

const { Title, Text } = Typography

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'request_update': return <CarOutlined className="text-blue-500" />
    case 'diagnosis': return <ToolOutlined className="text-green-500" />
    case 'message': return <MessageOutlined className="text-purple-500" />
    case 'transaction': return <ShoppingOutlined className="text-orange-500" />
    default: return <BellOutlined className="text-gray-500" />
  }
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'request_update': return 'blue'
    case 'diagnosis': return 'green'
    case 'message': return 'purple'
    case 'transaction': return 'orange'
    default: return 'default'
  }
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [loading, setLoading] = useState(true)
  const [markingRead, setMarkingRead] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user])

  useEffect(() => {
    // Subscribe to real-time notifications
    if (user?.id) {
      const unsubscribe = DatabaseService.subscribeToUserNotifications(user.id, (realtimeNotifications) => {
        // Get all notifications (not just unread) for the page
        loadNotifications()
      })
      return unsubscribe
    }
  }, [user])

  useEffect(() => {
    // Listen for FCM notifications
    const handleFCMNotification = (event: CustomEvent) => {
      console.log('FCM notification received on notifications page:', event.detail)
      // Refresh notifications when FCM message is received
      loadNotifications()
    }

    window.addEventListener('fcmNotificationReceived', handleFCMNotification as EventListener)
    return () => {
      window.removeEventListener('fcmNotificationReceived', handleFCMNotification as EventListener)
    }
  }, [])

  const loadNotifications = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const userNotifications = await DatabaseService.getNotificationsByUser(user.id)
      setNotifications(userNotifications)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setMarkingRead(notificationId)
      await DatabaseService.markNotificationAsRead(notificationId)
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    } finally {
      setMarkingRead(null)
    }
  }

  const handleNotificationClick = async (notification: NotificationData) => {
    // Mark as read first
    if (!notification.read) {
      await handleMarkAsRead(notification.id)
    }

    // Navigate based on notification type and data
    if (notification.data?.action === 'view_requests') {
      window.location.href = '/dashboard/mechanic/requests'
    } else if (notification.data?.action === 'view_request' && notification.data?.request_id) {
      if (user?.role === 'CarOwner') {
        window.location.href = `/dashboard/car-owner/requests`
      } else {
        window.location.href = `/dashboard/mechanic/requests`
      }
    } else if (notification.data?.action === 'view_diagnosis' && notification.data?.request_id) {
      window.location.href = `/dashboard/car-owner/requests`
    } else if (notification.data?.action === 'view_chat' && notification.data?.request_id) {
      window.location.href = `/dashboard/car-owner/requests/${notification.data.request_id}/chat`
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return time.toLocaleDateString()
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (!user) {
    return (
      <DashboardLayout activeKey="notifications">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout activeKey="notifications">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
          <div>
            <Title level={2} className="!text-xl sm:!text-2xl">
              <Space>
                <BellOutlined />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Badge count={unreadCount} />
                )}
              </Space>
            </Title>
            <Text type="secondary" className="!text-sm sm:!text-base">
              Stay updated with your car service requests and activities
            </Text>
          </div>
        </div>

        <Card>
          {notifications.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="text-center py-8">
                  <BellOutlined className="text-2xl sm:text-4xl text-gray-300 mb-4" />
                  <Title level={4} type="secondary" className="!text-base sm:!text-lg">No notifications yet</Title>
                  <Text type="secondary" className="!text-sm sm:!text-base">
                    You'll see updates about your service requests and activities here
                  </Text>
                </div>
              }
            />
          ) : (
            <List
              loading={loading}
              dataSource={notifications}
              renderItem={(notification) => (
                <List.Item
                  key={notification.id}
                  className={`${!notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''} hover:bg-gray-50 transition-colors cursor-pointer`}
                  actions={[
                    !notification.read && (
                      <Button
                        type="text"
                        size="small"
                        icon={<CheckOutlined />}
                        loading={markingRead === notification.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkAsRead(notification.id)
                        }}
                        className="!text-xs sm:!text-sm"
                      >
                        <span className="hidden sm:inline">Mark as read</span>
                        <span className="sm:hidden">Read</span>
                      </Button>
                    )
                  ].filter(Boolean)}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <List.Item.Meta
                    avatar={
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    }
                    title={
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                        <span className={`${!notification.read ? 'font-semibold' : 'font-medium'} text-sm sm:text-base`}>
                          {notification.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <Tag color={getNotificationColor(notification.type)} className="text-xs">
                            {notification.type.replace('_', ' ').toUpperCase()}
                          </Tag>
                          {!notification.read && (
                            <Badge color="blue" />
                          )}
                        </div>
                      </div>
                    }
                    description={
                      <div className="space-y-2">
                        <div className={`${!notification.read ? 'text-gray-700' : 'text-gray-500'} text-sm sm:text-base`}>
                          {notification.message}
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
                          <Text type="secondary" className="text-xs sm:text-sm">
                            {formatTimeAgo(notification.timestamp)}
                          </Text>
                          {notification.data && (
                            <Text type="secondary" className="text-xs">
                              {notification.data.car_info && (
                                <span>• {notification.data.car_info}</span>
                              )}
                              {notification.data.mechanic_name && (
                                <span>• Mechanic: {notification.data.mechanic_name}</span>
                              )}
                              {notification.data.amount && (
                                <span>• Amount: ${notification.data.amount}</span>
                              )}
                            </Text>
                          )}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
              pagination={{
                pageSize: 20,
                showSizeChanger: false,
                showQuickJumper: false,
                responsive: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} notifications`,
              }}
            />
          )}
        </Card>

        {/* Quick Stats */}
        {notifications.length > 0 && (
          <Card title={<span className="text-sm sm:text-base">Notification Summary</span>}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-blue-600">{unreadCount}</div>
                <div className="text-xs sm:text-sm text-gray-500">Unread</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-green-600">
                  {notifications.filter(n => n.type === 'diagnosis').length}
                </div>
                <div className="text-xs sm:text-sm text-gray-500">Diagnoses</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-purple-600">
                  {notifications.filter(n => n.type === 'message').length}
                </div>
                <div className="text-xs sm:text-sm text-gray-500">Messages</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-orange-600">
                  {notifications.filter(n => n.type === 'transaction').length}
                </div>
                <div className="text-xs sm:text-sm text-gray-500">Transactions</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
} 