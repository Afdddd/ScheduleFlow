package org.core.scheduleflow.domain.partner.service

import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.IsolationMode
import io.kotest.core.spec.style.BehaviorSpec
import io.kotest.matchers.collections.shouldContainAll
import io.kotest.matchers.shouldBe
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.core.scheduleflow.domain.partner.dto.PartnerContactRequestDto
import org.core.scheduleflow.domain.partner.dto.PartnerContactUpdateRequestDto
import org.core.scheduleflow.domain.partner.entity.Partner
import org.core.scheduleflow.domain.partner.entity.PartnerContact
import org.core.scheduleflow.domain.partner.repository.PartnerContactRepository
import org.core.scheduleflow.domain.partner.repository.PartnerRepository
import org.core.scheduleflow.domain.project.repository.ProjectPartnerContactRepository
import org.core.scheduleflow.global.exception.CustomException
import org.core.scheduleflow.global.exception.ErrorCode
import org.springframework.data.repository.findByIdOrNull

class PartnerContactServiceTest : BehaviorSpec({

    isolationMode = IsolationMode.InstancePerLeaf

    val partnerContactRepository = mockk<PartnerContactRepository>()
    val partnerRepository = mockk<PartnerRepository>()
    val projectPartnerContactRepository = mockk<ProjectPartnerContactRepository>()
    val partnerContactService = PartnerContactService(
        partnerContactRepository, partnerRepository, projectPartnerContactRepository
    )

    fun createPartner(id: Long = 1L, companyName: String = "모체 거래처"): Partner {
        return Partner(id = id, companyName = companyName, mainPhone = "02-1234-5678")
    }

    fun createContact(
        id: Long = 1L,
        partner: Partner,
        name: String = "홍길동",
        position: String? = "팀장",
        email: String? = "hong@test.com"
    ): PartnerContact {
        return PartnerContact(
            id = id,
            partner = partner,
            name = name,
            position = position,
            email = email
        )
    }

    Given("고객사 직원 등록 요청이 주어지고") {
        val partner = createPartner()
        val request = PartnerContactRequestDto(
            id = null,
            partnerId = 1L,
            name = "홍길동",
            position = "팀장",
            email = "hong@test.com"
        )
        val savedContact = createContact(partner = partner)

        every { partnerRepository.findByIdOrNull(1L) } returns partner
        every { partnerContactRepository.save(any<PartnerContact>()) } returns savedContact

        When("등록하면") {
            val result = partnerContactService.createPartnerContact(request, 1L)

            Then("직원 정보가 반환된다") {
                result.id shouldBe 1L
                result.name shouldBe "홍길동"
                result.partnerId shouldBe 1L
                verify(exactly = 1) { partnerRepository.findByIdOrNull(1L) }
                verify(exactly = 1) { partnerContactRepository.save(any<PartnerContact>()) }
            }
        }
    }

    Given("고객사 소속 직원 목록 조회 요청이 주어지고") {
        val partner = createPartner()
        val contact1 = createContact(id = 1L, partner = partner, name = "직원1")
        val contact2 = createContact(id = 2L, partner = partner, name = "직원2")

        every { partnerContactRepository.findByPartnerId(1L) } returns listOf(contact1, contact2)

        When("조회하면") {
            val result = partnerContactService.findPartnerContactByPartnerId(1L)

            Then("소속 직원 목록이 반환된다") {
                result.size shouldBe 2
                result.map { it.name } shouldContainAll listOf("직원1", "직원2")
            }
        }
    }

    Given("고객사 직원 수정 요청이 주어지고") {
        val partner = createPartner()
        val existingContact = createContact(
            partner = partner,
            name = "기존 이름",
            position = "사원",
            email = "old@test.com"
        )
        val updateRequest = PartnerContactUpdateRequestDto(
            id = 1L,
            name = "수정된 이름",
            position = "대리",
            email = "new@test.com",
            phone = "010-0000-0000",
            department = "ansjdkfjs"
        )

        every { partnerContactRepository.findByIdOrNull(1L) } returns existingContact
        every { partnerRepository.findByIdOrNull(1L) } returns partner
        every { partnerContactRepository.save(any()) } answers { firstArg() }

        When("수정하면") {
            val result = partnerContactService.updatePartnerContact(updateRequest, 1L)

            Then("수정된 직원 정보가 반환된다") {
                result.name shouldBe "수정된 이름"
                result.position shouldBe "대리"
                result.email shouldBe "new@test.com"
                verify(exactly = 1) { partnerContactRepository.findByIdOrNull(1L) }
                verify(exactly = 1) { partnerContactRepository.save(any()) }
            }
        }
    }

    Given("고객사 직원 삭제 요청이 주어지고") {
        val partner = createPartner(id = 1L)
        val contact = createContact(id = 10L, partner = partner, name = "삭제직원")

        every { partnerRepository.findByIdOrNull(1L) } returns partner
        every { partnerContactRepository.findByIdOrNull(10L) } returns contact
        every { projectPartnerContactRepository.deleteByPartnerContactId(10L) } returns Unit
        every { partnerContactRepository.deleteById(10L) } returns Unit

        When("삭제하면") {
            partnerContactService.deletePartnerContactById(1L, 10L)

            Then("직원과 관련 매핑 데이터가 삭제된다") {
                verify(exactly = 1) { projectPartnerContactRepository.deleteByPartnerContactId(10L) }
                verify(exactly = 1) { partnerContactRepository.deleteById(10L) }
            }
        }
    }

    Given("다른 고객사의 직원 삭제 요청이 주어지고") {
        val partnerA = createPartner(id = 1L, companyName = "A사")
        val partnerB = createPartner(id = 2L, companyName = "B사")
        val contactA = createContact(id = 10L, partner = partnerA, name = "A사 직원")

        every { partnerRepository.findByIdOrNull(2L) } returns partnerB
        every { partnerContactRepository.findByIdOrNull(10L) } returns contactA

        When("B사 ID로 A사 직원을 삭제하려고 하면") {
            val exception = shouldThrow<CustomException> {
                partnerContactService.deletePartnerContactById(2L, 10L)
            }

            Then("PARTNER_CONTACT_MISMATCH 예외가 발생한다") {
                exception.errorCode shouldBe ErrorCode.PARTNER_CONTACT_MISMATCH
                verify(exactly = 0) { partnerContactRepository.deleteById(any()) }
            }
        }
    }

    Given("존재하지 않는 직원 삭제 요청이 주어지고") {
        val partner = createPartner()
        every { partnerRepository.findByIdOrNull(1L) } returns partner
        every { partnerContactRepository.findByIdOrNull(9999L) } returns null

        When("삭제하면") {
            val exception = shouldThrow<CustomException> {
                partnerContactService.deletePartnerContactById(1L, 9999L)
            }

            Then("NOT_FOUND_PARTNER_CONTACT 예외가 발생한다") {
                exception.errorCode shouldBe ErrorCode.NOT_FOUND_PARTNER_CONTACT
            }
        }
    }
})
