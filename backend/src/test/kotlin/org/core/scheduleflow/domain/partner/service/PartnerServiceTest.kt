package org.core.scheduleflow.domain.partner.service

import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.IsolationMode
import io.kotest.core.spec.style.BehaviorSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.core.scheduleflow.domain.partner.dto.PartnerListResponse
import org.core.scheduleflow.domain.partner.dto.PartnerRequestDto
import org.core.scheduleflow.domain.partner.dto.PartnerUpdateRequestDto
import org.core.scheduleflow.domain.partner.entity.Partner
import org.core.scheduleflow.domain.partner.repository.PartnerContactRepository
import org.core.scheduleflow.domain.partner.repository.PartnerRepository
import org.core.scheduleflow.domain.project.entity.Project
import org.core.scheduleflow.domain.project.repository.ProjectRepository
import org.core.scheduleflow.global.exception.CustomException
import org.core.scheduleflow.global.exception.ErrorCode
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.data.repository.findByIdOrNull
import java.util.Optional

class PartnerServiceTest : BehaviorSpec({

    isolationMode = IsolationMode.InstancePerLeaf

    val partnerRepository = mockk<PartnerRepository>()
    val projectRepository = mockk<ProjectRepository>()
    val partnerContactRepository = mockk<PartnerContactRepository>()
    val partnerService = PartnerService(partnerRepository, projectRepository, partnerContactRepository)

    fun createPartner(
        id: Long = 1L,
        companyName: String = "테스트 컴퍼니",
        mainPhone: String? = "010-1234-5678",
        address: String? = "서울시 강남구",
        description: String? = "테스트용 업체"
    ): Partner {
        return Partner(
            id = id,
            companyName = companyName,
            mainPhone = mainPhone,
            address = address,
            description = description
        )
    }

    Given("정상적인 고객사 생성 요청이 주어지고") {
        val request = PartnerRequestDto(
            id = null,
            companyName = "테스트 컴퍼니",
            mainPhone = "010-1234-5678",
            address = "서울시 강남구",
            description = "테스트용 업체"
        )
        val savedPartner = createPartner()

        every { partnerRepository.save(any()) } returns savedPartner

        When("생성하면") {
            val result = partnerService.createPartner(request)

            Then("고객사 정보가 반환된다") {
                result.companyName shouldBe "테스트 컴퍼니"
                result.id shouldBe 1L
                verify(exactly = 1) { partnerRepository.save(any()) }
            }
        }
    }

    Given("존재하는 고객사 ID로 조회 요청이 주어지고") {
        val partner = createPartner()
        every { partnerRepository.findById(1L) } returns Optional.of(partner)

        When("조회하면") {
            val result = partnerService.findPartnerById(1L)

            Then("고객사 정보가 반환된다") {
                result shouldNotBe null
                result?.companyName shouldBe "테스트 컴퍼니"
            }
        }
    }

    Given("고객사 목록 조회 요청이 주어지고") {
        val pageable = Pageable.ofSize(5)
        val response1 = PartnerListResponse(1L, "테스트 컴퍼니", "010-1234-5678", "서울시 강남구")
        val response2 = PartnerListResponse(2L, "김앵도", "010-8689-5678", "서울시 강서구")
        val allPage = PageImpl(listOf(response1, response2), pageable, 2)

        When("키워드가 null이면") {
            every { partnerRepository.findPartners(pageable) } returns allPage

            val result = partnerService.findPartners(pageable, null)

            Then("전체 목록이 조회된다") {
                result.content.size shouldBe 2
                verify(exactly = 1) { partnerRepository.findPartners(pageable) }
                verify(exactly = 0) { partnerRepository.findByCompanyNameContains(any(), any()) }
            }
        }

        When("키워드가 주어지면") {
            val keywordPage = PageImpl(listOf(response1), pageable, 1)
            every { partnerRepository.findByCompanyNameContains(pageable, "테스트") } returns keywordPage

            val result = partnerService.findPartners(pageable, "테스트")

            Then("키워드로 검색된 목록이 조회된다") {
                result.content.size shouldBe 1
                verify(exactly = 1) { partnerRepository.findByCompanyNameContains(pageable, "테스트") }
            }
        }
    }

    Given("고객사 수정 요청이 주어지고") {
        val partner = createPartner(companyName = "초기이름")
        val updateRequest = PartnerUpdateRequestDto(
            id = 1L,
            companyName = "수정된이름",
            mainPhone = "02-111-2222",
            address = partner.address,
            description = "설명 추가"
        )

        every { partnerRepository.findByIdOrNull(1L) } returns partner
        every { partnerRepository.save(any()) } answers { firstArg() }

        When("수정하면") {
            val result = partnerService.updatePartner(updateRequest)

            Then("수정된 정보가 반환된다") {
                result.companyName shouldBe "수정된이름"
                result.mainPhone shouldBe "02-111-2222"
                verify(exactly = 1) { partnerRepository.findByIdOrNull(1L) }
                verify(exactly = 1) { partnerRepository.save(any()) }
            }
        }
    }

    Given("연결된 프로젝트가 없는 고객사 삭제 요청이 주어지고") {
        val partner = createPartner()

        every { partnerRepository.findByIdOrNull(1L) } returns partner
        every { projectRepository.findByPartnerId(1L) } returns emptyList()
        every { partnerContactRepository.deleteByPartnerId(1L) } returns Unit
        every { partnerRepository.deleteById(1L) } returns Unit

        When("삭제하면") {
            partnerService.deletePartnerById(1L)

            Then("고객사와 소속 직원이 모두 삭제된다") {
                verify(exactly = 1) { partnerContactRepository.deleteByPartnerId(1L) }
                verify(exactly = 1) { partnerRepository.deleteById(1L) }
            }
        }
    }

    Given("연결된 프로젝트가 있는 고객사 삭제 요청이 주어지고") {
        val partner = createPartner()
        val relatedProject = mockk<Project>()

        every { partnerRepository.findByIdOrNull(1L) } returns partner
        every { projectRepository.findByPartnerId(1L) } returns listOf(relatedProject)

        When("삭제하면") {
            val exception = shouldThrow<CustomException> {
                partnerService.deletePartnerById(1L)
            }

            Then("PARTNER_HAS_RELATED_PROJECT 예외가 발생한다") {
                exception.errorCode shouldBe ErrorCode.PARTNER_HAS_RELATED_PROJECT
                verify(exactly = 0) { partnerRepository.deleteById(any()) }
            }
        }
    }

    Given("존재하지 않는 고객사 삭제 요청이 주어지고") {
        every { partnerRepository.findByIdOrNull(9999L) } returns null

        When("삭제하면") {
            val exception = shouldThrow<CustomException> {
                partnerService.deletePartnerById(9999L)
            }

            Then("NOT_FOUND_PARTNER 예외가 발생한다") {
                exception.errorCode shouldBe ErrorCode.NOT_FOUND_PARTNER
            }
        }
    }
})
