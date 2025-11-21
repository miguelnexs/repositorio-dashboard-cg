from django.urls import path
from .api import SaleView, SalesListView, SalesStatsView, SalesNotificationCountView, SalesNotificationMarkReadView

urlpatterns = [
    path('', SaleView.as_view(), name='sales_create'),
    path('list/', SalesListView.as_view(), name='sales_list'),
    path('stats/', SalesStatsView.as_view(), name='sales_stats'),
    path('notifications/count/', SalesNotificationCountView.as_view(), name='sales_notifications_count'),
    path('notifications/read/', SalesNotificationMarkReadView.as_view(), name='sales_notifications_read'),
]
