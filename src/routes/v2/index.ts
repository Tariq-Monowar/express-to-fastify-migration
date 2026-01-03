import { FastifyInstance } from "fastify";

import exercises from './exercises/exercises.routes';
import appointment from './appointment/appointment.routes';
import featureAccess from './feature_access/feature_access.routes';
import notifications from './notifications/notifications.routes';
import dashboardOverview from './dashboard_overview/dashboard_overview.routes';
import software_version from './software_version/software_version.routes';
import order_settings from './order_settings/order_settings.routes';

async function partnerRoutes(fastify: FastifyInstance) {
  const moduleRoutes = [
    { path: '/exercises', route: exercises },
    { path: '/appointment', route: appointment },
    { path: '/feature-access', route: featureAccess },
    { path: '/notifications', route: notifications },
    { path: '/dashboard-overview', route: dashboardOverview },
    { path: '/software_version', route: software_version },
    { path: '/order_settings', route: order_settings }
  ];

  moduleRoutes.forEach(({ path, route }) => {
    fastify.register(route, { prefix: path });
  });
}

export default partnerRoutes;