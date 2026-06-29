package org.core.scheduleflow.domain.file.storage

import jakarta.annotation.PostConstruct
import org.core.scheduleflow.global.exception.CustomException
import org.core.scheduleflow.global.exception.ErrorCode
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.Resource
import org.springframework.core.io.UrlResource
import org.springframework.stereotype.Component
import org.springframework.web.multipart.MultipartFile
import java.io.IOException
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption

@Component
class LocalFileStorage(
    @Value("\${storage.path}")
    private val uploadPath: String,
    )
: FileStorage{
    private val logger = LoggerFactory.getLogger(this.javaClass)
    private val rootLocation = Path.of(uploadPath).toAbsolutePath().normalize()

    @PostConstruct
    fun init() {
        try {
            Files.createDirectories(rootLocation)
        } catch (e: IOException) {
            throw RuntimeException("루트 폴더를 생성할 수 없습니다.", e)
        }
    }

    override fun store(key: String, file: MultipartFile) {
        val target = rootLocation.resolve(key).normalize()
        Files.createDirectories(target.parent)
        file.inputStream.use { inputStream ->
            Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING)
        }
    }

    override fun loadAsResource(key: String): Resource =
        UrlResource(rootLocation.resolve(key).normalize().toUri())


    override fun delete(key: String) {
        val target = rootLocation.resolve(key).normalize()
        try {
            val isDeleted = Files.deleteIfExists(target)
            if(isDeleted) {
                logger.info("파일 삭제 완료 : {}", key)
            } else {
                logger.warn("파일이 존재하지 않아 삭제되지 않았습니다 : {}", key)
            }
        } catch (e: IOException) {
            logger.error("파일 삭제 중 I/O 오류 발생: {}", key, e)
            throw CustomException(ErrorCode.FAIL_DELETE_FILE)
        }
    }
}