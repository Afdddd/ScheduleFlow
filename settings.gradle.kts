rootProject.name = "ScheduleFlow"

include("backend")
project(":backend").projectDir = file("backend")

include("monitoring")
project(":monitoring").projectDir = file("monitoring")
