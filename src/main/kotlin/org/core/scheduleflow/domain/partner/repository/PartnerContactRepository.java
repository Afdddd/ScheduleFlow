package org.core.scheduleflow.domain.partner.repository;

import org.core.scheduleflow.domain.partner.entity.PartnerContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PartnerContactRepository extends JpaRepository<PartnerContact,Long> {

    List<PartnerContact> findByPartnerId(Long aLong);
}
