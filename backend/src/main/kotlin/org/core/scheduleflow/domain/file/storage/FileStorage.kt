package org.core.scheduleflow.domain.file.storage

import org.springframework.core.io.Resource
import org.springframework.web.multipart.MultipartFile

interface FileStorage {
    fun store(key: String, file: MultipartFile)
    fun loadAsResource(key: String): Resource
    fun delete(key: String)
}