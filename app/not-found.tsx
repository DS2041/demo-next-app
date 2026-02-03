import Button from '@/components/ButtonsUI/button'

export default function NotFound() {
  return (
    <div className="grid grid-cols-subgrid col-container flex flex-col relative frame frame-24 2xl:frame-40 lg:frame-outset-top-md 2xl:frame-outset-top py-12 2xl:pt-10 lg:pb-[5.5rem] gap-y-4 max-lg:px-4 pt-12 pb-16 flex flex-col gap-8 mb-10 md:mb-18">
      <h1 className="col-content text-7xl font-variation-extrabold font-display text-fern-1100">
        404
      </h1>
      <p className="col-content mb-2 text-ui-body max-w-prose">
        The path ends here - but the journey doesn’t. Let’s head home and give a fresh start. Always check the url of the website as it can lead to pages thatdoes not exist.
      </p>
      <p className='col-content mb-2 text-ui-body max-w-prose'>
        Let's go !
      </p>
      <Button
        href="/"
        theme="dandelion"
        className="col-content max-w-[max-content] self-start flex-auto"
      >
        Back to homepage
      </Button>
    </div>
  )
}
