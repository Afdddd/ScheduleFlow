package org.core.monitoring.collector

import io.github.oshai.kotlinlogging.KotlinLogging
import org.core.monitoring.domain.SystemMetrics
import org.springframework.stereotype.Component
import oshi.SystemInfo

private val logger = KotlinLogging.logger {}

@Component
class SystemResourceCollector {

    private val systemInfo = SystemInfo()
    private val hardware = systemInfo.hardware
    private val processor = hardware.processor

    private var prevTicks: LongArray = processor.systemCpuLoadTicks

    fun collect(): SystemMetrics {
        val cpuUsage = calculateCpuUsage()
        val memory = hardware.memory
        val fileStores = systemInfo.operatingSystem.fileSystem.fileStores

        // Calculate RAM usage
        val ramTotal = memory.total
        val ramAvailable = memory.available
        val ramUsed = ramTotal - ramAvailable
        val ramUsage = (ramUsed.toDouble() / ramTotal.toDouble()) * 100

        // Calculate SSD/Disk usage
        var ssdTotal = 0L
        var ssdUsed = 0L
        for (fs in fileStores) {
            if (fs.totalSpace > 0) {
                ssdTotal += fs.totalSpace
                ssdUsed += fs.totalSpace - fs.usableSpace
            }
        }
        val ssdUsage = if (ssdTotal > 0) (ssdUsed.toDouble() / ssdTotal.toDouble()) * 100 else 0.0

        // Battery status
        val powerSources = hardware.powerSources
        val batteryLevel: Int?
        val isPowerConnected: Boolean?

        if (powerSources.isNotEmpty()) {
            val battery = powerSources[0]
            batteryLevel = (battery.remainingCapacityPercent * 100).toInt()
            isPowerConnected = battery.isPowerOnLine
        } else {
            batteryLevel = null
            isPowerConnected = null
        }

        return SystemMetrics(
            cpuUsage = cpuUsage,
            ramUsage = ramUsage,
            ramTotal = ramTotal,
            ramUsed = ramUsed,
            ssdUsage = ssdUsage,
            ssdTotal = ssdTotal,
            ssdUsed = ssdUsed,
            batteryLevel = batteryLevel,
            isPowerConnected = isPowerConnected
        ).also {
            logger.debug { "Collected system metrics: CPU=${String.format("%.1f", it.cpuUsage)}%, RAM=${String.format("%.1f", it.ramUsage)}%, SSD=${String.format("%.1f", it.ssdUsage)}%" }
        }
    }

    private fun calculateCpuUsage(): Double {
        val currentTicks = processor.systemCpuLoadTicks
        val cpuLoad = processor.getSystemCpuLoadBetweenTicks(prevTicks) * 100
        prevTicks = currentTicks
        return cpuLoad
    }
}
