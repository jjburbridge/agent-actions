import {Suspense, useState} from 'react'
import {Box, Card, Flex, Grid, Heading, Spinner, Stack, Text} from '@sanity/ui'
import {ContentPanel} from './components/ContentPanel'
import {ExportActions} from './components/ExportActions'
import {MarketPicker} from './components/MarketPicker'
import {ProductPicker} from './components/ProductPicker'
import {SectionTree} from './components/SectionTree'

function PanelFallback() {
  return (
    <Flex align="center" justify="center" padding={5}>
      <Spinner muted />
    </Flex>
  )
}

function ButtonFallback() {
  return (
    <Flex align="center" padding={2}>
      <Spinner muted />
    </Flex>
  )
}

export function ContentExplorer() {
  const [productId, setProductId] = useState<string | null>(null)
  const [marketId, setMarketId] = useState<string | null>(null)
  const [sectionId, setSectionId] = useState<string | null>(null)

  const ready = Boolean(productId && marketId)

  return (
    <Box padding={4} height="fill" overflow="auto">
      <Stack gap={4}>
        <Flex align="center" justify="space-between" gap={4} wrap="wrap">
          <Stack gap={2}>
            <Heading as="h1" size={2}>
              Content explorer
            </Heading>
            <Text muted size={1}>
              Choose a product and market, browse the section tree, edit Portable Text, then export.
            </Text>
          </Stack>
          {productId && marketId && (
            <Suspense fallback={<ButtonFallback />}>
              <ExportActions productId={productId} marketId={marketId} />
            </Suspense>
          )}
        </Flex>

        <Grid gridTemplateColumns={[1, 1, 2]} gap={4}>
          <Suspense fallback={<PanelFallback />}>
            <ProductPicker
              value={productId}
              onChange={(id) => {
                setProductId(id)
                setSectionId(null)
              }}
            />
          </Suspense>
          <Suspense fallback={<PanelFallback />}>
            <MarketPicker
              value={marketId}
              onChange={(id) => {
                setMarketId(id)
                setSectionId(null)
              }}
            />
          </Suspense>
        </Grid>

        {!ready ? (
          <Card padding={5} radius={2} border tone="transparent">
            <Text muted>Select a product and market to load the section tree.</Text>
          </Card>
        ) : (
          <Grid gridTemplateColumns={[1, 1, 3]} gap={4}>
            <Card padding={3} radius={2} border style={{gridColumn: 'span 1'}}>
              <Stack gap={3}>
                <Heading as="h2" size={1}>
                  Sections
                </Heading>
                <Suspense fallback={<PanelFallback />}>
                  <SectionTree
                    productId={productId!}
                    marketId={marketId!}
                    selectedSectionId={sectionId}
                    onSelectSection={setSectionId}
                  />
                </Suspense>
              </Stack>
            </Card>

            <Card padding={4} radius={2} border style={{gridColumn: 'span 2'}}>
              {sectionId ? (
                <Suspense fallback={<PanelFallback />}>
                  <ContentPanel sectionId={sectionId} marketId={marketId!} />
                </Suspense>
              ) : (
                <Text muted>Select a section to view and edit its content for this market.</Text>
              )}
            </Card>
          </Grid>
        )}
      </Stack>
    </Box>
  )
}
