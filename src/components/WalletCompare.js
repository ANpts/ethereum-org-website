import React, { useState, useEffect } from "react"
import { useStaticQuery, graphql } from "gatsby"
import { useIntl, navigate } from "gatsby-plugin-intl"
import styled from "styled-components"
import { shuffle } from "lodash"

import ButtonLink from "./ButtonLink"
import Emoji from "./Emoji"
import Link from "./Link"
import SelectableCard from "./SelectableCard"
import Translation from "../components/Translation"
import Tag from "./Tag"
import WalletCard from "./WalletCard"
import { Content } from "./SharedStyledComponents"

import { getLocaleTimestamp } from "../utils/time"
import { trackCustomEvent } from "../utils/matomo"
import { translateMessageId } from "../utils/translations"

const Container = styled.div`
  margin-top: 2rem;
`

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  margin-bottom: 2rem;
`

const Subtitle = styled.div`
  font-size: 1.25rem;
  line-height: 140%;
  margin-bottom: 2rem;
  color: ${(props) => props.theme.colors.text200};
`

const GradientContainer = styled.div`
  width: 100%;
  background: ${(props) => props.theme.colors.cardGradient};
  padding: 3rem 2rem;
  border-top: 1px solid ${(props) => props.theme.colors.tableItemBoxShadow};
  border-bottom: 1px solid ${(props) => props.theme.colors.tableItemBoxShadow};
`

const WalletFeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
`

const FilterContainer = styled.div`
  min-height: 82px;
`

const TagsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  @media (max-width: ${(props) => props.theme.breakpoints.s}) {
    flex-direction: column;
  }
`

const TagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  max-width: 80%;
  @media (max-width: ${(props) => props.theme.breakpoints.s}) {
    max-width: 100%;
    margin-bottom: 1rem;
  }
`

const ClearLink = styled.button`
  color: ${(props) => props.theme.colors.primary};
  text-decoration: underline;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
`

export const walletCardImage = graphql`
  fragment walletCardImage on File {
    childImageSharp {
      gatsbyImageData(
        width: 64
        layout: CONSTRAINED
        placeholder: BLURRED
        quality: 100
      )
    }
  }
`

const ResultsContainer = styled.div`
  margin-top: 0rem;
`

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
  gap: 2rem;
`

const Disclaimer = styled.div`
  margin-top: 2rem;
`

// `id` fields must match src/data/wallets.csv column headers
const walletFeatures = [
  {
    id: "has_card_deposits",
    emoji: ":credit_card:",
    title: "page-find-wallet-buy-card",
    description: "page-find-wallet-buy-card-desc",
  },
  {
    id: "has_explore_dapps",
    emoji: ":world_map:",
    title: "page-find-wallet-explore-dapps",
    description: "page-find-wallet-explore-dapps-desc",
  },
  {
    id: "has_defi_integrations",
    emoji: ":money_with_wings:",
    title: "page-find-wallet-fi-tools",
    description: "page-find-wallet-fi-tools-desc",
  },
  {
    id: "has_bank_withdrawals",
    emoji: ":bank:",
    title: "page-find-wallet-withdraw",
    description: "page-find-wallet-withdraw-desc",
  },
  {
    id: "has_limits_protection",
    emoji: ":shield:",
    title: "page-find-wallet-limits",
    description: "page-find-wallet-limits-desc",
  },
  {
    id: "has_high_volume_purchases",
    emoji: ":whale:",
    title: "page-find-wallet-volume",
    description: "page-find-wallet-voluem-desc",
  },
  {
    id: "has_dex_integrations",
    emoji: ":repeat:",
    title: "page-find-wallet-swaps",
    description: "page-find-wallet-swaps-desc",
  },
  {
    id: "has_multisig",
    emoji: ":busts_in_silhouette:",
    title: "page-find-wallet-multisig",
    description: "page-find-wallet-multisig-desc",
  },
]

const WalletCompare = ({ location }) => {
  const [state, setState] = useState({
    selectedFeatureIds: [],
    wallets: [],
  })
  // image variables must match `id` column in src/data/wallets.csv
  const data = useStaticQuery(graphql`
    query {
      allWallets: allWalletsCsv {
        nodes {
          id
          name
          url
          brand_color
          has_mobile
          has_desktop
          has_web
          has_hardware
          has_card_deposits
          has_explore_dapps
          has_defi_integrations
          has_bank_withdrawals
          has_limits_protection
          has_high_volume_purchases
          has_dex_integrations
          has_multisig
          image {
            ...walletCardImage
          }
        }
      }
      timestamp: walletsCsv {
        parent {
          ... on File {
            id
            name
            fields {
              gitLogLatestDate
            }
          }
        }
      }
    }
  `)

  const intl = useIntl()

  useEffect(() => {
    // Fetch filters on load
    const queryParamFilters = new URLSearchParams(location.search || "").get(
      "filters"
    ) // Comma separated string
    const selectedFeatureIds = queryParamFilters
      ? queryParamFilters.split(",")
      : []

    const nodes = data.allWallets.nodes
    const wallets = shuffle(
      nodes.map((node) => {
        node.alt = translateMessageId(
          `page-find-wallet-${node.id}-logo-alt`,
          intl
        )
        node.description = translateMessageId(
          `page-find-wallet-description-${node.id}`,
          intl
        )
        return node
      })
    )
    setState({ selectedFeatureIds, wallets })
  }, [data, intl, location.search])

  let lastUpdated
  // TODO remove conditionals once file is registered in git
  if (data.timestamp.parent.fields) {
    lastUpdated = getLocaleTimestamp(
      intl.locale,
      data.timestamp.parent.fields.gitLogLatestDate
    )
  }

  const updatePath = (selectedFeatureIds) => {
    // Update URL path with new filter query params
    let newPath = "/wallets/find-wallet/"
    if (selectedFeatureIds.length > 0) {
      newPath += "?filters="
      for (const id of selectedFeatureIds) {
        newPath += `${id},`
      }
      newPath = newPath.substr(0, newPath.length - 1)
    }
    // Apply new path without refresh if within `window`
    if (window) {
      newPath = `/${intl.locale}` + newPath
      window.history.pushState(null, "", newPath)
    } else {
      navigate(newPath)
    }
  }

  const clearFilters = () => {
    setState({ ...state, selectedFeatureIds: [] })
    updatePath([])
  }

  // Add feature filter (or remove if already selected)
  const handleSelect = (featureId) => {
    const selectedFeatureIds = state.selectedFeatureIds

    const index = selectedFeatureIds.indexOf(featureId)
    if (index > -1) {
      selectedFeatureIds.splice(index, 1)
    } else {
      selectedFeatureIds.push(featureId)

      trackCustomEvent({
        eventCategory: `Wallet feature`,
        eventAction: `Selected`,
        eventName: featureId,
      })
    }
    setState({ selectedFeatureIds, wallets: state.wallets })
    updatePath(selectedFeatureIds)
  }

  let filteredWallets = state.wallets.filter((wallet) => {
    for (const featureId of state.selectedFeatureIds) {
      if (wallet[featureId] !== "TRUE") {
        return false
      }
    }
    return true
  })

  const hasSelectedFeatures = state.selectedFeatureIds.length > 0
  const selectedFeatures = walletFeatures.filter((feature) =>
    state.selectedFeatureIds.includes(feature.id)
  )
  const remainingFeatures = walletFeatures.filter(
    (feature) => !state.selectedFeatureIds.includes(feature.id)
  )

  return (
    <Container>
      <Content>
        <h2>
          <Translation id="page-find-wallet-feature-h2" />
        </h2>
        <WalletFeaturesGrid>
          {walletFeatures.map((card, idx) => {
            const isSelected = state.selectedFeatureIds.includes(card.id)
            return (
              <SelectableCard
                key={idx}
                emoji={card.emoji}
                title={translateMessageId(card.title, intl)}
                description={translateMessageId(card.description, intl)}
                isSelected={isSelected}
                onSelect={handleSelect}
                value={card.id}
              />
            )
          })}
        </WalletFeaturesGrid>

        <ButtonContainer id="results">
          <ButtonLink to="/wallets/find-wallet/#results">
            <Translation id="page-find-wallet-search-btn" />
          </ButtonLink>
        </ButtonContainer>
      </Content>

      <GradientContainer>
        <h2>
          <Translation id="page-find-wallet-Ethereum-wallets" />
        </h2>
        <FilterContainer>
          {hasSelectedFeatures && (
            <Subtitle>
              <Translation id="page-find-wallet-we-found" />{" "}
              {filteredWallets.length}{" "}
              {filteredWallets.length === 1 ? "wallet" : "wallets"}{" "}
              <Translation id="page-find-wallet-following-features" />
            </Subtitle>
          )}
          {!hasSelectedFeatures && (
            <Subtitle>
              <Translation id="page-find-wallet-showing" />
              {filteredWallets.length}{" "}
              <Translation id="page-find-wallet-overwhelmed" />
            </Subtitle>
          )}
          <TagsContainer>
            <TagContainer>
              {selectedFeatures.map((feature) => (
                <Tag
                  key={feature.id}
                  name={translateMessageId(feature.title, intl)}
                  onSelect={handleSelect}
                  value={feature.id}
                />
              ))}
              {remainingFeatures.map((feature) => (
                <Tag
                  key={feature.id}
                  name={translateMessageId(feature.title, intl)}
                  onSelect={handleSelect}
                  value={feature.id}
                  isActive={false}
                />
              ))}
            </TagContainer>
            {hasSelectedFeatures && (
              <ClearLink onClick={clearFilters}>
                <Translation id="page-find-wallet-clear" />
              </ClearLink>
            )}
          </TagsContainer>
        </FilterContainer>
        {filteredWallets.length === 0 && (
          <ResultsContainer>
            <Emoji text=":crying_face:" size={3} mb={`2em`} mt={`2em`} />
            <h2>
              <Translation id="page-find-wallet-not-all-features" />
            </h2>
            <p>
              <Translation id="page-find-wallet-try-removing" />
            </p>
          </ResultsContainer>
        )}
        <ResultsContainer>
          <ResultsGrid>
            {filteredWallets.map((wallet) => (
              <WalletCard wallet={wallet} key={wallet.id} />
            ))}
          </ResultsGrid>
        </ResultsContainer>
        <Disclaimer>
          <p>
            <em>
              <Translation id="page-find-wallet-not-endorsements" />{" "}
              <Link to="/contributing/adding-products/">
                <Translation id="page-find-wallet-listing-policy" />
              </Link>
              <Translation id="page-find-wallet-add-wallet" />{" "}
              <Link to="https://github.com/ethereum/ethereum-org-website/issues/new/choose">
                <Translation id="page-find-wallet-raise-an-issue" />
              </Link>
              .{" "}
              {lastUpdated && (
                <span>
                  <Translation id="page-find-wallet-last-updated" />{" "}
                  <strong>{lastUpdated}</strong>.
                </span>
              )}
            </em>
          </p>
        </Disclaimer>
      </GradientContainer>
    </Container>
  )
}

export default WalletCompare
