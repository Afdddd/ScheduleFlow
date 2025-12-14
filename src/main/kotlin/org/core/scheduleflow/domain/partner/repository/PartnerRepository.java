package org.core.scheduleflow.domain.partner.repository;

import org.core.scheduleflow.domain.partner.entity.Partner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PartnerRepository extends JpaRepository<Partner, Long> {


    List<Partner> findAll();

    @Override
    Optional<Partner> findById(Long id);

    List<Partner> selectPartnerByNameContains(String name);


}
