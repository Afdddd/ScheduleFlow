package org.core.monitoring.dashboard

import org.core.monitoring.scheduler.HealthCheckScheduler
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping

@Controller
@RequestMapping("/admin/monitoring")
class DashboardViewController(
    private val healthCheckScheduler: HealthCheckScheduler
) {

    @GetMapping("/dashboard")
    fun dashboard(model: Model): String {
        val health = healthCheckScheduler.getCurrentHealth()
        model.addAttribute("health", health)
        return "dashboard"
    }
}
