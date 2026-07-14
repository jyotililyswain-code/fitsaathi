-- Preserve every existing dojo image while making the non-cropping display
-- mode the default for both existing and future profiles.
ALTER TABLE public.dojos
  ADD COLUMN IF NOT EXISTS "imageFit" TEXT NOT NULL DEFAULT 'contain',
  ADD COLUMN IF NOT EXISTS "imagePosition" TEXT NOT NULL DEFAULT 'center';

UPDATE public.dojos
SET
  "imageFit" = CASE WHEN "imageFit" IN ('contain', 'cover') THEN "imageFit" ELSE 'contain' END,
  "imagePosition" = CASE WHEN "imagePosition" IN ('top', 'center', 'bottom') THEN "imagePosition" ELSE 'center' END;

ALTER TABLE public.dojos
  DROP CONSTRAINT IF EXISTS dojos_image_fit_check,
  DROP CONSTRAINT IF EXISTS dojos_image_position_check;

ALTER TABLE public.dojos
  ADD CONSTRAINT dojos_image_fit_check CHECK ("imageFit" IN ('contain', 'cover')),
  ADD CONSTRAINT dojos_image_position_check CHECK ("imagePosition" IN ('top', 'center', 'bottom'));
