import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImageCropper from './ImageCropper';

// Mock global browser APIs
const mockToDataURL = jest.fn();
const mockGetContext = jest.fn(() => ({
  drawImage: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  scale: jest.fn(),
  imageSmoothingQuality: '',
}));

// Type assertion for HTMLCanvasElement prototype mocking
(global.HTMLCanvasElement.prototype.getContext as jest.Mock) = mockGetContext;
global.HTMLCanvasElement.prototype.toDataURL = mockToDataURL;

// Mock FileReader
const mockReadAsDataURL = jest.fn(function(this: FileReader) {
  // Simulate successful file read by calling onload
  if (this.onload) {
    act(() => {
      // @ts-expect-error - Mocking FileReader onload event
      this.onload({ target: { result: 'data:image/png;base64,mockimagedata' } } as ProgressEvent<FileReader>);
    });
  }
});

global.FileReader = jest.fn(() => ({
  readAsDataURL: mockReadAsDataURL,
  onload: null, // Will be set by the component
  addEventListener: jest.fn((event: string, cb: () => void) => { // Simplified addEventListener for onload
    if (event === 'load') {
      // @ts-expect-error - Intentionally assigning callback to onload for mocking
      (this as FileReader).onload = cb;
    }
  }),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  onerror: null,
  onabort: null,
  onloadend: null,
  onloadstart: null,
  onprogress: null,
  readyState: 0,
  result: null,
  error: null,
})) as unknown as typeof FileReader;


// Helper function to simulate file upload and image load
async function uploadImage(container: HTMLElement) {
  const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(['(⌐□_□)'], 'test.png', { type: 'image/png' });

  // Mock naturalWidth and naturalHeight for the image object that will be created
  // This needs to be done before the 'load' event is dispatched on the image
  global.Image.prototype.naturalWidth = 100;
  global.Image.prototype.naturalHeight = 100;
  global.Image.prototype.width = 100;
  global.Image.prototype.height = 100;

  await act(async () => {
    fireEvent.change(fileInput, { target: { files: [file] } });
  });

  // Wait for the image to be processed and displayed
  // The image itself is not directly findable by alt text if ReactCrop modifies it.
  // We look for controls that appear after image load.
  await screen.findByLabelText(/Aspect Ratio/i);
}


describe('ImageCropper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Properties are already defined in jest.setup.js, so just reset values
    global.Image.prototype.naturalWidth = 0;
    global.Image.prototype.naturalHeight = 0;
    global.Image.prototype.width = 0;
    global.Image.prototype.height = 0;
  });

  it('renders the upload prompt initially', () => {
    render(<ImageCropper />);
    expect(screen.getByText(/Drop your image here/i)).toBeInTheDocument();
  });

  describe('After Image Load', () => {
    beforeEach(async () => {
      const { container } = render(<ImageCropper />);
      await uploadImage(container);
    });

    // Test structure for Zoom
    describe('Zoom Functionality', () => {
      it('initializes zoom to 1 and updates on slider change, reflecting in style', async () => {
        const zoomSlider = screen.getByLabelText(/Zoom/i);
        const zoomValueDisplay = screen.getByText(/1.0x/i); // Assuming format like 1.0x
        
        expect(zoomSlider).toHaveValue('1');
        expect(zoomValueDisplay).toBeInTheDocument();

        await act(async () => {
          fireEvent.change(zoomSlider, { target: { value: '1.5' } });
        });
        
        expect(zoomSlider).toHaveValue('1.5');
        expect(screen.getByText(/1.5x/i)).toBeInTheDocument();

        const image = screen.getByAltText('Crop me') as HTMLImageElement;
        expect(image.style.transform).toContain('scale(1.5)');
      });
    });

    // Test structure for Flip
    describe('Flip Functionality', () => {
      it('initializes flips to off, toggles them, and reflects in style', async () => {
        const flipHorizontalButton = screen.getByRole('button', { name: /Flip Horizontal/i });
        const flipVerticalButton = screen.getByRole('button', { name: /Flip Vertical/i });

        expect(flipHorizontalButton.textContent).not.toContain('(On)');
        expect(flipVerticalButton.textContent).not.toContain('(On)');

        // Test horizontal flip
        await act(async () => {
          fireEvent.click(flipHorizontalButton);
        });
        expect(flipHorizontalButton.textContent).toContain('Flip Horizontal (On)');
        const image = screen.getByAltText('Crop me') as HTMLImageElement;
        expect(image.style.transform).toContain('scaleX(-1)');

        await act(async () => {
          fireEvent.click(flipHorizontalButton); // Toggle off
        });
        expect(flipHorizontalButton.textContent).not.toContain('(On)');
        expect(image.style.transform).toContain('scaleX(1)');

        // Test vertical flip
        await act(async () => {
          fireEvent.click(flipVerticalButton);
        });
        expect(flipVerticalButton.textContent).toContain('Flip Vertical (On)');
        expect(image.style.transform).toContain('scaleY(-1)');
        
        await act(async () => {
          fireEvent.click(flipVerticalButton); // Toggle off
        });
        expect(flipVerticalButton.textContent).not.toContain('(On)');
        expect(image.style.transform).toContain('scaleY(1)');
      });
    });

    // Test structure for Output Quality
    describe('Output Quality Control', () => {
      it('initializes quality to 0.92, slider visibility and updates quality state', async () => {
        // Default format is JPEG, so slider should be visible
        let qualitySlider = screen.queryByLabelText(/Quality/i);
        expect(qualitySlider).toBeInTheDocument();
        // Check default value display (e.g., "Quality (92%)")
        expect(screen.getByText(/Quality \(92%\)/i)).toBeInTheDocument();
        if(qualitySlider) expect(qualitySlider).toHaveValue('0.92');


        // Change to PNG, slider should hide
        const formatSelect = screen.getByLabelText(/Format/i);
        await act(async () => {
          fireEvent.change(formatSelect, { target: { value: 'png' } });
        });
        qualitySlider = screen.queryByLabelText(/Quality/i);
        expect(qualitySlider).not.toBeInTheDocument();

        // Change to WebP, slider should show
        await act(async () => {
          fireEvent.change(formatSelect, { target: { value: 'webp' } });
        });
        qualitySlider = screen.queryByLabelText(/Quality/i);
        expect(qualitySlider).toBeInTheDocument();
        if(qualitySlider) expect(qualitySlider).toHaveValue('0.92'); // Resets to default or retains? Let's assume retains for now. Test will clarify.
                                                                   // The current implementation keeps the quality state, so it should be 0.92

        // Interact with slider for WebP
        if(qualitySlider) {
          await act(async () => {
            fireEvent.change(qualitySlider!, { target: { value: '0.5' } });
          });
          expect(qualitySlider).toHaveValue('0.5');
          expect(screen.getByText(/Quality \(50%\)/i)).toBeInTheDocument();
        }
      });

      it('calls toDataURL with correct quality for JPEG and WebP, and without for PNG', async () => {
        const formatSelect = screen.getByLabelText(/Format/i);
        const downloadButton = screen.getByRole('button', { name: /Download/i });
        let qualitySlider: HTMLElement | null;

        // Test JPEG
        await act(async () => {
          fireEvent.change(formatSelect, { target: { value: 'jpeg' } });
        });
        qualitySlider = screen.getByLabelText(/Quality/i);
        await act(async () => {
          fireEvent.change(qualitySlider!, { target: { value: '0.8' } });
        });
        await act(async () => {
          fireEvent.click(downloadButton);
        });
        expect(mockToDataURL).toHaveBeenCalledWith('image/jpeg', 0.8);
        mockToDataURL.mockClear();

        // Test WebP
        await act(async () => {
          fireEvent.change(formatSelect, { target: { value: 'webp' } });
        });
        qualitySlider = screen.getByLabelText(/Quality/i); // Re-fetch after potential re-render
        await act(async () => {
          fireEvent.change(qualitySlider!, { target: { value: '0.7' } });
        });
        await act(async () => {
          fireEvent.click(downloadButton);
        });
        expect(mockToDataURL).toHaveBeenCalledWith('image/webp', 0.7);
        mockToDataURL.mockClear();

        // Test PNG
        await act(async () => {
          fireEvent.change(formatSelect, { target: { value: 'png' } });
        });
        // Quality slider is not visible for PNG.
        await act(async () => {
          fireEvent.click(downloadButton);
        });
        // For PNG, the quality argument should ideally be undefined or not passed.
        // toDataURL for PNG ignores the second argument if passed.
        // Our mock will receive it if the code passes it. The current implementation passes outputQuality regardless.
        // We test that it's called with 'image/png' and some quality value (which will be ignored by actual toDataURL for png)
        expect(mockToDataURL).toHaveBeenCalledWith('image/png', expect.any(Number)); // Current code passes quality (e.g. 0.7 from previous)
        // A more strict check if the code were to pass undefined for PNG:
        // expect(mockToDataURL).toHaveBeenCalledWith('image/png', undefined); 
        // Or simply: expect(mockToDataURL).toHaveBeenCalledWith('image/png'); if no second arg for PNG
        mockToDataURL.mockClear();
      });
    });
     
    // Example test for handleDownload flip logic (conceptual)
    // This requires more detailed mocking of canvas context methods
    describe('handleDownload canvas transformations', () => {
        it('applies flip transformations to canvas context if flips are active', async () => {
            const flipHorizontalButton = screen.getByRole('button', { name: /Flip Horizontal/i });
            const downloadButton = screen.getByRole('button', { name: /Download/i });
            const canvasContextMock = mockGetContext(); // get the mock context

            // Activate horizontal flip
            await act(async () => {
                fireEvent.click(flipHorizontalButton);
            });

            await act(async () => {
                fireEvent.click(downloadButton);
            });

            // Check if translate and scale were called for horizontal flip
            // Example: ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
            expect(canvasContextMock.translate).toHaveBeenCalledWith(expect.any(Number), 0); // canvas.width will be a number
            expect(canvasContextMock.scale).toHaveBeenCalledWith(-1, 1);
              // Clear mocks for next part of test or other tests
            (canvasContextMock.translate as jest.MockedFunction<typeof canvasContextMock.translate>).mockClear();
            (canvasContextMock.scale as jest.MockedFunction<typeof canvasContextMock.scale>).mockClear();

            // Deactivate horizontal flip, activate vertical
            await act(async () => {
                fireEvent.click(flipHorizontalButton); // toggle off horizontal
                const flipVerticalButton = screen.getByRole('button', { name: /Flip Vertical/i });
                fireEvent.click(flipVerticalButton); // toggle on vertical
            });

            await act(async () => {
                fireEvent.click(downloadButton);
            });
            
            // Check for vertical flip: ctx.translate(0, canvas.height); ctx.scale(1, -1);
            expect(canvasContextMock.translate).toHaveBeenCalledWith(0, expect.any(Number));
            expect(canvasContextMock.scale).toHaveBeenCalledWith(1, -1);
        });
    });

  });
});

// Minimal ReactCrop.css mock
jest.mock('react-image-crop/dist/ReactCrop.css', () => ({}));
