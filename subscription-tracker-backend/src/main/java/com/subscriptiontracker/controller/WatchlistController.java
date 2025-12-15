package com.subscriptiontracker.controller;

import com.subscriptiontracker.dto.ApiResponse;
import com.subscriptiontracker.dto.WatchlistDTO;
import com.subscriptiontracker.dto.WatchlistRequest;
import com.subscriptiontracker.service.WatchlistService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/watchlist")
public class WatchlistController {

    @Autowired
    private WatchlistService watchlistService;

    // Get user's watchlist
    @GetMapping
    public ResponseEntity<ApiResponse<List<WatchlistDTO>>> getWatchlist() {
        List<WatchlistDTO> watchlist = watchlistService.getWatchlist();
        return ResponseEntity.ok(ApiResponse.success(watchlist));
    }

    // Add to watchlist
    @PostMapping
    public ResponseEntity<ApiResponse<WatchlistDTO>> addToWatchlist(
            @Valid @RequestBody WatchlistRequest request) {
        WatchlistDTO watchlistItem = watchlistService.addToWatchlist(request);
        return ResponseEntity.ok(ApiResponse.success("Added to watchlist!", watchlistItem));
    }

    // Update watchlist item
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WatchlistDTO>> updateWatchlistItem(
            @PathVariable Long id,
            @Valid @RequestBody WatchlistRequest request) {
        WatchlistDTO watchlistItem = watchlistService.updateWatchlistItem(id, request);
        return ResponseEntity.ok(ApiResponse.success("Watchlist updated!", watchlistItem));
    }

    // Remove from watchlist
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> removeFromWatchlist(@PathVariable Long id) {
        watchlistService.removeFromWatchlist(id);
        return ResponseEntity.ok(ApiResponse.success("Removed from watchlist!", null));
    }
}