package org.core.scheduleflow.domain.file.storage

import org.core.scheduleflow.global.exception.CustomException
import org.core.scheduleflow.global.exception.ErrorCode
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.core.io.ByteArrayResource
import org.springframework.core.io.Resource
import org.springframework.stereotype.Component
import org.springframework.web.multipart.MultipartFile
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest
import software.amazon.awssdk.services.s3.model.GetObjectRequest
import software.amazon.awssdk.services.s3.model.NoSuchKeyException
import software.amazon.awssdk.services.s3.model.PutObjectRequest

@Component
@ConditionalOnProperty(name = ["storage.type"], havingValue = "s3")
class S3FileStorage(
    private val s3Client: S3Client,
    @Value("\${aws.s3.bucket}") private val bucket: String,
): FileStorage {
    override fun store(key: String, file: MultipartFile) {
        val request = PutObjectRequest.builder()
            .bucket(bucket)            // 어느 버킷에
            .key(key)                  // 어떤 경로(키)로  예: QUOTATION/uuid.txt
            .contentType(file.contentType)  // 파일 타입 메타데이터
            .build()
        // 두 번째 인자 = 실제 파일 내용(본문). 스트림과 크기를 넘김
        s3Client.putObject(request, RequestBody.fromInputStream(file.inputStream, file.size))
    }

    // 다운로드: S3에서 GET 해서 Resource로 감싸 반환
    override fun loadAsResource(key: String): Resource {
        val request = GetObjectRequest.builder()
            .bucket(bucket)
            .key(key)
            .build()
        return try {
            val bytes = s3Client.getObjectAsBytes(request).asByteArray()  // 통째로 메모리에
            ByteArrayResource(bytes)   // Spring이 이해하는 Resource로 포장
        } catch (e: NoSuchKeyException) {
            throw CustomException(ErrorCode.NOT_FOUND_FILE)  // 없는 키 → 404로 변환
        }
    }

    // 삭제: S3 객체 DELETE
    override fun delete(key: String) {
        val request = DeleteObjectRequest.builder()
            .bucket(bucket)
            .key(key)
            .build()
        s3Client.deleteObject(request)   // 없는 키여도 에러 안 남(멱등)
    }
}