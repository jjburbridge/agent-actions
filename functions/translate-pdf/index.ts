import {createClient} from '@sanity/client'
import {documentEventHandler} from '@sanity/functions'
import {createReadStream, promises as fs} from 'node:fs'
import {pdf} from 'pdf-to-img'

function toPlainText(blocks: any[] = []) {
  return (
    blocks
      // loop through each block
      .map((block) => {
        // if it's not a text block with children,
        // return nothing
        if ((block._type && block._type !== 'block') || !block.children) {
          return ''
        }
        // loop through the children spans, and join the
        // text strings
        return block.children.map((child: any) => child.text).join('')
      })
      // join the paragraphs leaving split by two linebreaks
      .join('\n\n')
  )
}

export const handler = documentEventHandler(async ({context, event}) => {
  const time = new Date().toLocaleTimeString()
  console.log(`👋 Your Sanity Function was called at ${time}`)

  const {_ref} = event.data.sourceFile.asset

  const [type, id, format] = _ref.split('-')

  const url = `https://cdn.sanity.io/${type}s/${context.clientOptions.projectId}/${context.clientOptions.dataset}/${id}.${format}`
  console.log('url', url)
  const response = await fetch(url)
  const pdfResponse = await response.arrayBuffer()
  const pdfBuffer = Buffer.from(pdfResponse)
  const pdfBase64 = pdfBuffer.toString('base64')
  const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`

  const document = await pdf(pdfDataUrl, {scale: 3})
  let counter = 0
  for await (const image of document) {
    await fs.writeFile(`page${counter}.png`, image)
    counter++
  }

  console.log('PDF converted to images')

  const client = createClient({
    ...context.clientOptions,
    apiVersion: 'vX',
  })

  const imageIds: string[] = []

  const BATCH_SIZE = 3 // Adjust based on your rate limits

  for (let batchStart = 0; batchStart < counter; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, counter)
    const batchPromises = []

    console.log(`Uploading batch: pages ${batchStart} to ${batchEnd - 1}`)

    // Create batch of upload promises
    for (let i = batchStart; i < batchEnd; i++) {
      batchPromises.push(client.assets.upload('image', createReadStream(`page${i}.png`)))
    }

    // Wait for this batch to complete
    const batchResults = await Promise.all(batchPromises)

    // Process batch results
    batchResults.forEach((image) => {
      console.log('imageAsset uploaded:', image._id)
      imageIds.push(image._id)
    })

    // Optional: Add delay between batches if needed
    // if (batchEnd < counter - 1) {
    //   console.log("Waiting 1 second before next batch...");
    //   await new Promise((resolve) => setTimeout(resolve, 1000));
    // }
  }

  console.log(`All ${imageIds.length} images uploaded successfully`)

  // Update document with all images at once
  const fullBaseText: any[] = []

  // Process images in batches to avoid rate limiting
  for (let imageBatchStart = 0; imageBatchStart < imageIds.length; imageBatchStart += BATCH_SIZE) {
    const batchEnd = Math.min(imageBatchStart + BATCH_SIZE, imageIds.length)
    const batchPromises = []

    console.log(`Processing batch: images ${imageBatchStart} to ${batchEnd - 1}`)

    // Create batch of transform promises
    for (let i = imageBatchStart; i < batchEnd; i++) {
      const imageId = imageIds[i]
      const [_, id, size, format] = imageId.split('-')
      const imageUrl: `https://${string}` = `https://cdn.sanity.io/images/${context.clientOptions.projectId}/${context.clientOptions.dataset}/${id}-${size}.${format}`
      console.log('imageUrl', imageUrl)
      batchPromises.push(
        client.agent.action.transform({
          schemaId: '_.schemas.default', //you can get this from running `sanity schema list in teh cli`
          documentId: event.data._id,
          noWrite: true,
          instruction: 'get the text from the image',
          target: {
            path: ['baseText'],
            operation: {
              type: 'image-description',
              imageUrl: imageUrl,
            },
          },
        }),
      )
    }

    // Wait for this batch to complete
    const batchResults = await Promise.all(batchPromises)

    // Process batch results
    batchResults.forEach((imageText) => {
      fullBaseText.push(imageText.baseText)
    })
  }
  console.log('fullBaseText', fullBaseText)
  // fullBaseText.push(imageText);
  // }

  // Clean up uploaded images
  for (const imageId of imageIds) {
    await client.delete(imageId)
  }
  console.log(`Deleted ${imageIds.length} temporary images`)

  const language = (await client.agent.action.prompt({
    // write an instruction
    instruction: `give the two-letter code and the name of the language for the language $fullBaseText is written in. Respond in JSON with the following format: { "id": "en", "title": "English" }`,
    instructionParams: {
      fullBaseText: {
        type: 'constant',
        value: toPlainText(fullBaseText),
      },
    },
    format: 'json',
  })) as unknown as {id: string; title: string}

  await client.agent.action.patch({
    schemaId: '_.schemas.default',
    documentId: event.data._id,
    target: {
      path: ['baseText'],
      operation: 'set',
      value: fullBaseText,
    },
  })

  await client.agent.action.translate({
    schemaId: '_.schemas.default',
    documentId: event.data._id,
    fromLanguage: language,
    toLanguage: {id: 'en', title: 'English'},
  })
})
